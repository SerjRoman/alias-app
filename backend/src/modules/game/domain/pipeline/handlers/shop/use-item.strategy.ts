import { v4 as uuidv4 } from "uuid";
import type { ActionStrategy } from "../../../dispatcher/action-dispatcher";
import type { UseItemAction } from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";
import {
	ShopService,
	SHOP_CATALOG,
	DEBUFF_EFFECT_IDS,
	type ShopCatalogItem,
	type ShopInventoryItem,
	ShopItemNotFoundError,
	ItemNotInInventoryError,
	InvalidEffectTargetError,
	EffectAlreadyActiveError,
	ShopDisabledError,
} from "../../../shop";
import {
	GameNotInProgressError,
	PlayerNotFoundError,
} from "../../../errors/game.errors";
import {
	NoActiveWordError,
	RoundIsNotInProgress,
} from "../../../errors/round.errors";
import { ItemUsedDomainEvent } from "../../../events/game.events";
import {
	RoundStatus,
	type ActiveEffect,
	type EffectStatus,
	type GameState,
	type PlayerState,
} from "../../../state/game.state";

const EXTRA_TIME_MS = 10_000;
const TIME_DRAIN_MS = 5_000;
const MIN_ROUND_REMAINING_MS = 1_000;

export class UseItemStrategy implements ActionStrategy<UseItemAction> {
	readonly actionType = "USE_ITEM" as const;

	constructor(
		private readonly catalog: readonly ShopCatalogItem[] = SHOP_CATALOG,
	) {}

	handle(action: UseItemAction, ctx: ActionContext): void {
		const { state, emit, now } = ctx;
		const timestamp = now ?? Date.now();

		this.assertShopAndGameActive(state);
		const player = this.resolveActivePlayer(state, action.actorId);
		const catalogItem = this.resolveCatalogItem(
			state,
			player.id,
			action.payload.inventoryItemId,
		);

		if (
			catalogItem.durationType === "seconds" &&
			state.currentRound?.status !== RoundStatus.IN_PROGRESS
		) {
			throw new RoundIsNotInProgress(
				"Timed effects can only be used while a round is in progress",
			);
		}

		const { targetTeamId, targetPlayerId } = this.resolveTarget(
			catalogItem,
			player,
			action.payload,
			state,
		);

		if (catalogItem.durationType === "instant") {
			this.applyInstantEffect(
				catalogItem,
				state,
				action.payload,
				targetTeamId,
				timestamp,
			);
			ShopService.removeItem(
				state,
				player.id,
				action.payload.inventoryItemId,
			);
			emit(
				new ItemUsedDomainEvent(
					state.id,
					player.id,
					catalogItem.id,
					uuidv4(),
					"CONSUMED",
					targetTeamId,
					targetPlayerId,
				),
			);
			return;
		}

		this.assertNotAlreadyActive(
			state.activeEffects,
			catalogItem.id,
			targetTeamId,
			targetPlayerId,
		);

		ShopService.removeItem(
			state,
			player.id,
			action.payload.inventoryItemId,
		);

		const effect = this.createActiveEffect(
			catalogItem,
			player.id,
			targetTeamId,
			targetPlayerId,
			state,
			timestamp,
		);

		state.activeEffects ??= [];
		state.activeEffects.push(effect);

		emit(
			new ItemUsedDomainEvent(
				state.id,
				player.id,
				catalogItem.id,
				effect.id,
				effect.status,
				targetTeamId,
				targetPlayerId,
				effect.durationMs,
				effect.expiresAt,
			),
		);
	}

	private assertShopAndGameActive(state: GameState): void {
		if (state.settings?.isShopEnabled === false) {
			throw new ShopDisabledError();
		}
		if (state.status !== "IN_PROGRESS") {
			throw new GameNotInProgressError();
		}
	}

	private resolveActivePlayer(
		state: GameState,
		actorId: string,
	): PlayerState {
		const player = state.players.find((p) => p.id === actorId);
		if (!player) {
			throw new PlayerNotFoundError(actorId);
		}
		if (!player.teamId) {
			throw new InvalidEffectTargetError(
				"Player must belong to a team to use items",
			);
		}
		return player;
	}

	private resolveCatalogItem(
		state: GameState,
		playerId: string,
		inventoryItemId: string,
	): ShopCatalogItem {
		const inventory: ShopInventoryItem[] = ShopService.getInventory(
			state,
			playerId,
		);
		const inventoryItem = inventory.find(
			(it: ShopInventoryItem) => it.id === inventoryItemId,
		);
		if (!inventoryItem) {
			throw new ItemNotInInventoryError(inventoryItemId);
		}

		const catalogItem = this.catalog.find(
			(it: ShopCatalogItem) => it.id === inventoryItem.itemId,
		);
		if (!catalogItem) {
			throw new ShopItemNotFoundError(inventoryItem.itemId);
		}
		return catalogItem;
	}

	private resolveTarget(
		catalogItem: ShopCatalogItem,
		player: PlayerState,
		payload: UseItemAction["payload"],
		state: GameState,
	): { targetTeamId?: string; targetPlayerId?: string } {
		if (catalogItem.target === "self_team") {
			const targetTeamId = payload.targetTeamId ?? player.teamId;
			if (targetTeamId !== player.teamId) {
				throw new InvalidEffectTargetError(
					"Cannot apply self_team effect to an enemy team",
				);
			}
			return { targetTeamId };
		}

		if (catalogItem.target === "enemy_team") {
			const targetTeamId = payload.targetTeamId;
			if (!targetTeamId) {
				throw new InvalidEffectTargetError("Target team is required");
			}
			const targetTeam = state.teams.find((t) => t.id === targetTeamId);
			if (!targetTeam || targetTeam.id === player.teamId) {
				throw new InvalidEffectTargetError(
					"Must target a valid enemy team",
				);
			}
			return { targetTeamId };
		}

		return this.resolveEnemyPlayerTarget(
			catalogItem,
			player,
			payload,
			state,
		);
	}

	private resolveEnemyPlayerTarget(
		catalogItem: ShopCatalogItem,
		player: PlayerState,
		payload: UseItemAction["payload"],
		state: GameState,
	): { targetPlayerId: string } {
		const isEnemyRoundInProgress =
			state.currentRound?.status === RoundStatus.IN_PROGRESS &&
			state.currentRound.teamId !== player.teamId;

		const targetPlayerId =
			payload.targetPlayerId ??
			(isEnemyRoundInProgress
				? state.currentRound?.explainerId
				: undefined);

		if (!targetPlayerId) {
			throw new InvalidEffectTargetError("Target player is required");
		}
		const targetPlayer = state.players.find((p) => p.id === targetPlayerId);
		if (!targetPlayer || targetPlayer.teamId === player.teamId) {
			throw new InvalidEffectTargetError("Must target an enemy player");
		}

		if (
			catalogItem.id === "FLIP_WORD" ||
			catalogItem.id === "FREEZE_NEXT_WORD"
		) {
			if (
				!isEnemyRoundInProgress ||
				state.currentRound?.explainerId !== targetPlayerId
			) {
				throw new InvalidEffectTargetError(
					"Can only apply to the active enemy explainer during an active round",
				);
			}
		}

		return { targetPlayerId };
	}

	private assertNotAlreadyActive(
		activeEffects: ActiveEffect[],
		itemId: string,
		targetTeamId?: string,
		targetPlayerId?: string,
	): void {
		const existingEffect = activeEffects.some((eff: ActiveEffect) => {
			if (eff.itemId !== itemId || eff.status === "CONSUMED") {
				return false;
			}
			if (targetTeamId && eff.targetTeamId === targetTeamId) {
				return true;
			}
			return Boolean(
				targetPlayerId && eff.targetPlayerId === targetPlayerId,
			);
		});

		if (existingEffect) {
			throw new EffectAlreadyActiveError(
				itemId,
				targetTeamId ?? targetPlayerId ?? "",
			);
		}
	}

	private createActiveEffect(
		catalogItem: ShopCatalogItem,
		playerId: string,
		targetTeamId: string | undefined,
		targetPlayerId: string | undefined,
		state: GameState,
		timestamp: number,
	): ActiveEffect {
		let initialStatus: EffectStatus = "ACTIVE";
		let expiresAt: number | undefined;
		let durationMs: number | undefined;
		let charges: number | undefined;

		if (catalogItem.durationType === "round") {
			const round = state.currentRound;
			const isTargetPlayingNow =
				round?.status === RoundStatus.IN_PROGRESS &&
				round.teamId === targetTeamId;
			initialStatus = isTargetPlayingNow ? "ACTIVE" : "ARMED";
		} else if (catalogItem.durationType === "seconds") {
			durationMs = (catalogItem.durationSeconds ?? 5) * 1000;
			expiresAt = timestamp + durationMs;
		} else if (catalogItem.durationType === "charges") {
			charges = catalogItem.charges ?? 1;
		}

		return {
			id: uuidv4(),
			itemId: catalogItem.id,
			sourcePlayerId: playerId,
			targetTeamId,
			targetPlayerId,
			status: initialStatus,
			durationMs,
			expiresAt,
			charges,
		};
	}

	private applyInstantEffect(
		catalogItem: ShopCatalogItem,
		state: GameState,
		payload: UseItemAction["payload"],
		targetTeamId: string | undefined,
		timestamp: number,
	): void {
		switch (catalogItem.id) {
			case "CLEANSE": {
				const teamPlayerIds = new Set(
					state.players
						.filter((p) => p.teamId === targetTeamId)
						.map((p) => p.id),
				);
				const debuffs = (state.activeEffects ?? []).filter(
					(eff) =>
						eff.status !== "CONSUMED" &&
						DEBUFF_EFFECT_IDS.has(eff.itemId) &&
						(eff.targetTeamId === targetTeamId ||
							(eff.targetPlayerId !== undefined &&
								teamPlayerIds.has(eff.targetPlayerId))),
				);
				if (debuffs.length === 0) {
					throw new InvalidEffectTargetError(
						"No active debuffs to cleanse",
					);
				}
				for (const eff of debuffs) {
					eff.status = "CONSUMED";
					eff.expiresAt = undefined;
					eff.remainingMs = null;
					eff.pausedAt = null;
				}
				return;
			}
			case "EXTRA_TIME": {
				const round = this.assertActiveTeamRound(state, targetTeamId);
				if (round.pausedAt != null) {
					round.remainingMs =
						(round.remainingMs ?? 0) + EXTRA_TIME_MS;
				} else {
					round.expiresAt += EXTRA_TIME_MS;
				}
				return;
			}
			case "TIME_DRAIN": {
				const round = this.assertActiveTeamRound(state, targetTeamId);
				if (round.pausedAt != null) {
					const currentRemaining = round.remainingMs ?? 0;
					round.remainingMs = Math.max(
						MIN_ROUND_REMAINING_MS,
						currentRemaining - TIME_DRAIN_MS,
					);
				} else {
					const currentRemaining = Math.max(
						0,
						round.expiresAt - timestamp,
					);
					const nextRemaining = Math.max(
						MIN_ROUND_REMAINING_MS,
						currentRemaining - TIME_DRAIN_MS,
					);
					round.expiresAt = timestamp + nextRemaining;
				}
				return;
			}
			case "REROLL_WORD": {
				const round = this.assertActiveTeamRound(state, targetTeamId);
				if (!round.currentWord) {
					throw new NoActiveWordError("No active word to reroll");
				}
				if (!payload.nextWordText) {
					throw new NoActiveWordError(
						"Replacement word text is required",
					);
				}
				round.currentWord = {
					id: uuidv4(),
					text: payload.nextWordText,
					score: 0,
				};
				return;
			}
		}
	}

	private assertActiveTeamRound(
		state: GameState,
		targetTeamId: string | undefined,
	) {
		const round = state.currentRound;
		if (round?.status !== RoundStatus.IN_PROGRESS) {
			throw new RoundIsNotInProgress(
				"This item can only be used while a round is in progress",
			);
		}
		if (targetTeamId && round.teamId !== targetTeamId) {
			throw new InvalidEffectTargetError(
				"Target team is not currently playing",
			);
		}
		return round;
	}
}
