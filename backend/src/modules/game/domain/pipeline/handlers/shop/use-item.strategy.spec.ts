import { UseItemStrategy } from "./use-item.strategy";
import { ShopService } from "../../../shop/shop.service";
import {
	EffectAlreadyActiveError,
	InvalidEffectTargetError,
	ItemNotInInventoryError,
	ShopDisabledError,
} from "../../../shop/shop.types";
import {
	GameNotInProgressError,
	PlayerNotFoundError,
} from "../../../errors/game.errors";
import { RoundIsNotInProgress } from "../../../errors/round.errors";
import { ItemUsedDomainEvent } from "../../../events/game.events";
import { RoundStatus, type GameState } from "../../../state/game.state";
import type { UseItemAction } from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";

describe("UseItemStrategy", () => {
	const createMockState = (
		overrides: Partial<GameState> = {},
	): GameState => ({
		id: "room-1",
		ownerId: "user-1",
		status: "IN_PROGRESS",
		pointsToWin: 30,
		settings: {
			name: "Test Room",
			roundTimeSeconds: 60,
			pointsToWin: 30,
			code: null,
			isPrivate: false,
			wordPackSelections: [],
			wordsPerPlayer: 0,
			isHatMode: false,
			isOnlyOwnerCanNextRound: false,
			isOnlyOwnerCanChangeScore: false,
			isVoiceChatEnabled: true,
			isShopEnabled: true,
		},
		teams: [
			{
				id: "team-1",
				name: "Red",
				color: "#FF0000",
				score: 0,
				playerIds: ["user-1"],
			},
			{
				id: "team-2",
				name: "Blue",
				color: "#0000FF",
				score: 0,
				playerIds: ["user-2"],
			},
		],
		players: [
			{
				id: "user-1",
				name: "Alice",
				role: "registered",
				isReady: true,
				isRoundReady: false,
				isOnline: true,
				teamId: "team-1",
			},
			{
				id: "user-2",
				name: "Bob",
				role: "registered",
				isReady: true,
				isRoundReady: false,
				isOnline: true,
				teamId: "team-2",
			},
		],
		bannedPlayerIds: [],
		activeTeamId: "team-1",
		currentRound: null,
		activeEffects: [],
		addons: {},
		...overrides,
	});

	const createMockContext = (
		state: GameState,
		action: UseItemAction,
		now = 2000,
	): ActionContext => ({
		action,
		state,
		emit: jest.fn(),
		now,
	});

	it("uses a self_team round effect (ARMED when round is not in progress)", () => {
		const strategy = new UseItemStrategy();
		const state = createMockState();
		ShopService.addItem(state, "user-1", {
			id: "inv-1",
			itemId: "DOUBLE_POINTS",
			purchasedAt: 1000,
		});

		const action: UseItemAction = {
			type: "USE_ITEM",
			actorId: "user-1",
			payload: { inventoryItemId: "inv-1" },
		};
		const ctx = createMockContext(state, action);

		strategy.handle(action, ctx);

		expect(ShopService.getInventory(state, "user-1")).toHaveLength(0);
		expect(state.activeEffects).toHaveLength(1);
		expect(state.activeEffects[0]!).toMatchObject({
			itemId: "DOUBLE_POINTS",
			sourcePlayerId: "user-1",
			targetTeamId: "team-1",
			status: "ARMED",
		});

		expect(ctx.emit).toHaveBeenCalledWith(expect.any(ItemUsedDomainEvent));
		expect(ctx.emit).toHaveBeenCalledWith(
			expect.objectContaining({
				roomId: "room-1",
				playerId: "user-1",
				itemId: "DOUBLE_POINTS",
				status: "ARMED",
				targetTeamId: "team-1",
			}),
		);
	});

	it("uses a self_team round effect (ACTIVE when round of that team is IN_PROGRESS)", () => {
		const strategy = new UseItemStrategy();
		const state = createMockState({
			currentRound: {
				id: "round-1",
				teamId: "team-1",
				explainerId: "user-1",
				status: RoundStatus.IN_PROGRESS,
				roundNumber: 1,
				expiresAt: 10000,
				words: [],
				currentWord: null,
			},
		});
		ShopService.addItem(state, "user-1", {
			id: "inv-1",
			itemId: "DOUBLE_POINTS",
			purchasedAt: 1000,
		});

		const action: UseItemAction = {
			type: "USE_ITEM",
			actorId: "user-1",
			payload: { inventoryItemId: "inv-1" },
		};
		const ctx = createMockContext(state, action);

		strategy.handle(action, ctx);

		expect(state.activeEffects[0].status).toBe("ACTIVE");
	});

	it("uses an enemy_team effect and validates enemy target", () => {
		const strategy = new UseItemStrategy();
		const state = createMockState();
		ShopService.addItem(state, "user-1", {
			id: "inv-1",
			itemId: "ENEMY_SKIP_PENALTY",
			purchasedAt: 1000,
		});

		const action: UseItemAction = {
			type: "USE_ITEM",
			actorId: "user-1",
			payload: {
				inventoryItemId: "inv-1",
				targetTeamId: "team-2",
			},
		};
		const ctx = createMockContext(state, action);

		strategy.handle(action, ctx);

		expect(state.activeEffects[0]!).toMatchObject({
			itemId: "ENEMY_SKIP_PENALTY",
			sourcePlayerId: "user-1",
			targetTeamId: "team-2",
			status: "ARMED",
		});
	});

	it("throws InvalidEffectTargetError if enemy_team effect is targeted at own team", () => {
		const strategy = new UseItemStrategy();
		const state = createMockState();
		ShopService.addItem(state, "user-1", {
			id: "inv-1",
			itemId: "ENEMY_SKIP_PENALTY",
			purchasedAt: 1000,
		});

		const action: UseItemAction = {
			type: "USE_ITEM",
			actorId: "user-1",
			payload: {
				inventoryItemId: "inv-1",
				targetTeamId: "team-1",
			},
		};
		const ctx = createMockContext(state, action);

		expect(() => strategy.handle(action, ctx)).toThrow(
			InvalidEffectTargetError,
		);
	});

	it("uses a charges-based effect (FREE_SKIP_SHIELD) with initial charges", () => {
		const strategy = new UseItemStrategy();
		const state = createMockState();
		ShopService.addItem(state, "user-1", {
			id: "inv-1",
			itemId: "FREE_SKIP_SHIELD",
			purchasedAt: 1000,
		});

		const action: UseItemAction = {
			type: "USE_ITEM",
			actorId: "user-1",
			payload: { inventoryItemId: "inv-1" },
		};
		const ctx = createMockContext(state, action);

		strategy.handle(action, ctx);

		expect(state.activeEffects[0]!).toMatchObject({
			itemId: "FREE_SKIP_SHIELD",
			targetTeamId: "team-1",
			status: "ACTIVE",
			charges: 1,
		});
	});

	it("uses a seconds-based effect (FREEZE_NEXT_WORD) with expiresAt set when round is IN_PROGRESS", () => {
		const strategy = new UseItemStrategy();
		const state = createMockState({
			currentRound: {
				id: "r-1",
				teamId: "team-2",
				explainerId: "user-2",
				status: RoundStatus.IN_PROGRESS,
				roundNumber: 1,
				expiresAt: 10000,
				words: [],
				currentWord: { id: "w-1", text: "Apple", score: 0 },
			},
		});
		ShopService.addItem(state, "user-1", {
			id: "inv-1",
			itemId: "FREEZE_NEXT_WORD",
			purchasedAt: 1000,
		});

		const action: UseItemAction = {
			type: "USE_ITEM",
			actorId: "user-1",
			payload: {
				inventoryItemId: "inv-1",
				targetPlayerId: "user-2",
			},
		};
		const ctx = createMockContext(state, action);

		strategy.handle(action, ctx);

		expect(state.activeEffects[0]!).toMatchObject({
			itemId: "FREEZE_NEXT_WORD",
			targetPlayerId: "user-2",
			status: "ACTIVE",
			expiresAt: 2000 + 5000, // now + 5s
		});
	});

	it("throws RoundIsNotInProgress when using seconds-based effect (FREEZE_NEXT_WORD) before round starts", () => {
		const strategy = new UseItemStrategy();
		const state = createMockState({ currentRound: null });
		ShopService.addItem(state, "user-1", {
			id: "inv-1",
			itemId: "FREEZE_NEXT_WORD",
			purchasedAt: 1000,
		});

		const action: UseItemAction = {
			type: "USE_ITEM",
			actorId: "user-1",
			payload: {
				inventoryItemId: "inv-1",
				targetPlayerId: "user-2",
			},
		};
		const ctx = createMockContext(state, action);

		expect(() => strategy.handle(action, ctx)).toThrow(RoundIsNotInProgress);
		expect(ShopService.getInventory(state, "user-1")).toHaveLength(1);
	});

	it("throws EffectAlreadyActiveError if same effect is already ARMED or ACTIVE on target", () => {
		const strategy = new UseItemStrategy();
		const state = createMockState({
			activeEffects: [
				{
					id: "eff-1",
					itemId: "DOUBLE_POINTS",
					sourcePlayerId: "user-1",
					targetTeamId: "team-1",
					status: "ARMED",
				},
			],
		});
		ShopService.addItem(state, "user-1", {
			id: "inv-1",
			itemId: "DOUBLE_POINTS",
			purchasedAt: 1000,
		});

		const action: UseItemAction = {
			type: "USE_ITEM",
			actorId: "user-1",
			payload: { inventoryItemId: "inv-1" },
		};
		const ctx = createMockContext(state, action);

		expect(() => strategy.handle(action, ctx)).toThrow(
			EffectAlreadyActiveError,
		);
		// Item should remain in inventory
		expect(ShopService.getInventory(state, "user-1")).toHaveLength(1);
	});

	it("throws ItemNotInInventoryError if item does not exist in inventory", () => {
		const strategy = new UseItemStrategy();
		const state = createMockState();

		const action: UseItemAction = {
			type: "USE_ITEM",
			actorId: "user-1",
			payload: { inventoryItemId: "non-existent" },
		};
		const ctx = createMockContext(state, action);

		expect(() => strategy.handle(action, ctx)).toThrow(
			ItemNotInInventoryError,
		);
	});

	it("throws GameNotInProgressError if game is in LOBBY", () => {
		const strategy = new UseItemStrategy();
		const state = createMockState({ status: "LOBBY" });

		const action: UseItemAction = {
			type: "USE_ITEM",
			actorId: "user-1",
			payload: { inventoryItemId: "inv-1" },
		};
		const ctx = createMockContext(state, action);

		expect(() => strategy.handle(action, ctx)).toThrow(
			GameNotInProgressError,
		);
	});

	it("throws PlayerNotFoundError if actor is not in game", () => {
		const strategy = new UseItemStrategy();
		const state = createMockState();

		const action: UseItemAction = {
			type: "USE_ITEM",
			actorId: "ghost",
			payload: { inventoryItemId: "inv-1" },
		};
		const ctx = createMockContext(state, action);

		expect(() => strategy.handle(action, ctx)).toThrow(PlayerNotFoundError);
	});

	it("throws ShopDisabledError if isShopEnabled is false in settings", () => {
		const strategy = new UseItemStrategy();
		const state = createMockState({
			settings: {
				...createMockState().settings,
				isShopEnabled: false,
			},
		});

		const action: UseItemAction = {
			type: "USE_ITEM",
			actorId: "user-1",
			payload: { inventoryItemId: "inv-1" },
		};
		const ctx = createMockContext(state, action);

		expect(() => strategy.handle(action, ctx)).toThrow(ShopDisabledError);
	});

	it("throws InvalidEffectTargetError if actor is a spectator (no teamId)", () => {
		const strategy = new UseItemStrategy();
		const state = createMockState();
		const spectator = state.players.find((p) => p.id === "user-1");
		if (spectator) {
			spectator.teamId = undefined;
		}

		const action: UseItemAction = {
			type: "USE_ITEM",
			actorId: "user-1",
			payload: { inventoryItemId: "inv-1" },
		};
		const ctx = createMockContext(state, action);

		expect(() => strategy.handle(action, ctx)).toThrow(
			InvalidEffectTargetError,
		);
	});

	it("auto-targets active enemy explainer when targetPlayerId is omitted for FREEZE_NEXT_WORD during enemy round", () => {
		const strategy = new UseItemStrategy();
		const state = createMockState({
			currentRound: {
				id: "r-enemy",
				teamId: "team-2",
				explainerId: "user-2",
				status: RoundStatus.IN_PROGRESS,
				roundNumber: 1,
				expiresAt: 10_000,
				words: [],
				currentWord: { id: "w-1", text: "Apple", score: 0 },
			},
		});
		ShopService.addItem(state, "user-1", {
			id: "inv-freeze-1",
			itemId: "FREEZE_NEXT_WORD",
			purchasedAt: 1000,
		});

		const action: UseItemAction = {
			type: "USE_ITEM",
			actorId: "user-1",
			payload: { inventoryItemId: "inv-freeze-1" }, // no targetPlayerId provided
		};
		const ctx = createMockContext(state, action);

		strategy.handle(action, ctx);

		const effect = state.activeEffects.find(
			(e) => e.itemId === "FREEZE_NEXT_WORD",
		);
		expect(effect).toBeDefined();
		expect(effect?.targetPlayerId).toBe("user-2"); // auto-targeted enemy explainer
		expect(effect?.status).toBe("ACTIVE");
	});

	it("CLEANSE removes active enemy debuffs from own team and its players", () => {
		const strategy = new UseItemStrategy();
		const state = createMockState({
			activeEffects: [
				{
					id: "eff-1",
					itemId: "ENEMY_SKIP_PENALTY",
					sourcePlayerId: "user-2",
					targetTeamId: "team-1",
					status: "ACTIVE",
				},
				{
					id: "eff-2",
					itemId: "FLIP_WORD",
					sourcePlayerId: "user-2",
					targetPlayerId: "user-1",
					status: "ACTIVE",
					expiresAt: 15_000,
				},
				{
					id: "eff-buff",
					itemId: "DOUBLE_POINTS",
					sourcePlayerId: "user-1",
					targetTeamId: "team-1",
					status: "ACTIVE",
				},
			],
		});
		ShopService.addItem(state, "user-1", {
			id: "inv-cleanse-1",
			itemId: "CLEANSE",
			purchasedAt: 1000,
		});

		const action: UseItemAction = {
			type: "USE_ITEM",
			actorId: "user-1",
			payload: { inventoryItemId: "inv-cleanse-1" },
		};
		const ctx = createMockContext(state, action);

		strategy.handle(action, ctx);

		expect(state.activeEffects.find((e) => e.id === "eff-1")?.status).toBe(
			"CONSUMED",
		);
		expect(state.activeEffects.find((e) => e.id === "eff-2")?.status).toBe(
			"CONSUMED",
		);
		expect(
			state.activeEffects.find((e) => e.id === "eff-buff")?.status,
		).toBe("ACTIVE");
		expect(ShopService.getInventory(state, "user-1")).toHaveLength(0);
	});

	it("CLEANSE throws InvalidEffectTargetError when there are no active debuffs", () => {
		const strategy = new UseItemStrategy();
		const state = createMockState();
		ShopService.addItem(state, "user-1", {
			id: "inv-cleanse-2",
			itemId: "CLEANSE",
			purchasedAt: 1000,
		});

		const action: UseItemAction = {
			type: "USE_ITEM",
			actorId: "user-1",
			payload: { inventoryItemId: "inv-cleanse-2" },
		};
		const ctx = createMockContext(state, action);

		expect(() => strategy.handle(action, ctx)).toThrow(
			InvalidEffectTargetError,
		);
		expect(ShopService.getInventory(state, "user-1")).toHaveLength(1);
	});

	it("EXTRA_TIME adds 10 seconds to own active round", () => {
		const strategy = new UseItemStrategy();
		const state = createMockState({
			currentRound: {
				id: "r-own",
				teamId: "team-1",
				explainerId: "user-1",
				status: RoundStatus.IN_PROGRESS,
				roundNumber: 1,
				expiresAt: 20_000,
				words: [],
				currentWord: { id: "w-1", text: "Apple", score: 0 },
			},
		});
		ShopService.addItem(state, "user-1", {
			id: "inv-extra-1",
			itemId: "EXTRA_TIME",
			purchasedAt: 1000,
		});

		const action: UseItemAction = {
			type: "USE_ITEM",
			actorId: "user-1",
			payload: { inventoryItemId: "inv-extra-1" },
		};
		const ctx = createMockContext(state, action);

		strategy.handle(action, ctx);

		expect(state.currentRound?.expiresAt).toBe(30_000);
		expect(ShopService.getInventory(state, "user-1")).toHaveLength(0);
	});

	it("TIME_DRAIN subtracts 5 seconds from enemy active round with 1s floor", () => {
		const strategy = new UseItemStrategy();
		const state = createMockState({
			currentRound: {
				id: "r-enemy",
				teamId: "team-2",
				explainerId: "user-2",
				status: RoundStatus.IN_PROGRESS,
				roundNumber: 1,
				expiresAt: 8_000,
				words: [],
				currentWord: { id: "w-1", text: "Apple", score: 0 },
			},
		});
		ShopService.addItem(state, "user-1", {
			id: "inv-drain-1",
			itemId: "TIME_DRAIN",
			purchasedAt: 1000,
		});

		const action: UseItemAction = {
			type: "USE_ITEM",
			actorId: "user-1",
			payload: { inventoryItemId: "inv-drain-1", targetTeamId: "team-2" },
		};
		const ctx = createMockContext(state, action, 5_000);

		strategy.handle(action, ctx);

		expect(state.currentRound?.expiresAt).toBe(6_000);
		expect(ShopService.getInventory(state, "user-1")).toHaveLength(0);
	});

	it("REROLL_WORD replaces currentWord without pushing to words feed", () => {
		const strategy = new UseItemStrategy();
		const state = createMockState({
			currentRound: {
				id: "r-own",
				teamId: "team-1",
				explainerId: "user-1",
				status: RoundStatus.IN_PROGRESS,
				roundNumber: 1,
				expiresAt: 20_000,
				words: [],
				currentWord: { id: "w-1", text: "Apple", score: 0 },
			},
		});
		ShopService.addItem(state, "user-1", {
			id: "inv-reroll-1",
			itemId: "REROLL_WORD",
			purchasedAt: 1000,
		});

		const action: UseItemAction = {
			type: "USE_ITEM",
			actorId: "user-1",
			payload: {
				inventoryItemId: "inv-reroll-1",
				nextWordText: "Banana",
			},
		};
		const ctx = createMockContext(state, action);

		strategy.handle(action, ctx);

		expect(state.currentRound?.currentWord?.text).toBe("Banana");
		expect(state.currentRound?.words).toHaveLength(0);
		expect(ShopService.getInventory(state, "user-1")).toHaveLength(0);
	});

	it("FLIP_WORD creates timed ACTIVE effect on enemy explainer", () => {
		const strategy = new UseItemStrategy();
		const state = createMockState({
			currentRound: {
				id: "r-enemy",
				teamId: "team-2",
				explainerId: "user-2",
				status: RoundStatus.IN_PROGRESS,
				roundNumber: 1,
				expiresAt: 20_000,
				words: [],
				currentWord: { id: "w-1", text: "Apple", score: 0 },
			},
		});
		ShopService.addItem(state, "user-1", {
			id: "inv-flip-1",
			itemId: "FLIP_WORD",
			purchasedAt: 1000,
		});

		const action: UseItemAction = {
			type: "USE_ITEM",
			actorId: "user-1",
			payload: { inventoryItemId: "inv-flip-1" },
		};
		const ctx = createMockContext(state, action, 5_000);

		strategy.handle(action, ctx);

		const effect = state.activeEffects.find(
			(e) => e.itemId === "FLIP_WORD",
		);
		expect(effect).toBeDefined();
		expect(effect?.targetPlayerId).toBe("user-2");
		expect(effect?.status).toBe("ACTIVE");
		expect(effect?.expiresAt).toBe(13_000);
	});

	it("FLIP_WORD throws InvalidEffectTargetError when own team is playing", () => {
		const strategy = new UseItemStrategy();
		const state = createMockState({
			currentRound: {
				id: "r-own",
				teamId: "team-1",
				explainerId: "user-1",
				status: RoundStatus.IN_PROGRESS,
				roundNumber: 1,
				expiresAt: 20_000,
				words: [],
				currentWord: { id: "w-1", text: "Apple", score: 0 },
			},
		});
		ShopService.addItem(state, "user-1", {
			id: "inv-flip-own",
			itemId: "FLIP_WORD",
			purchasedAt: 1000,
		});

		const action: UseItemAction = {
			type: "USE_ITEM",
			actorId: "user-1",
			payload: {
				inventoryItemId: "inv-flip-own",
				targetPlayerId: "user-2",
			},
		};
		const ctx = createMockContext(state, action, 5_000);

		expect(() => strategy.handle(action, ctx)).toThrow(
			InvalidEffectTargetError,
		);
		expect(ShopService.getInventory(state, "user-1")).toHaveLength(1);
	});
});
