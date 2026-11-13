import { v4 as uuidv4 } from "uuid";
import type { ActionStrategy } from "../../../dispatcher/action-dispatcher";
import type { UseItemAction } from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";
import {
	ShopService,
	SHOP_CATALOG,
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
import { ItemUsedDomainEvent } from "../../../events/game.events";
import {
	RoundStatus,
	type ActiveEffect,
	type EffectStatus,
	type GameState,
	type PlayerState,
} from "../../../state/game.state";

export class UseItemStrategy implements ActionStrategy<UseItemAction> {
	readonly actionType = "USE_ITEM" as const;

	constructor(
		private readonly catalog: readonly ShopCatalogItem[] = SHOP_CATALOG,
	) {}

	handle(action: UseItemAction, ctx: ActionContext): void {
		const { state, emit, now } = ctx;

		this.assertShopAndGameActive(state);
		const player = this.resolveActivePlayer(state, action.actorId);
		const catalogItem = this.resolveCatalogItem(
			state,
			player.id,
			action.payload.inventoryItemId,
		);

		const { targetTeamId, targetPlayerId } = this.resolveTarget(
			catalogItem,
			player,
			action.payload,
			state,
		);

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
			now ?? Date.now(),
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

		return this.resolveEnemyPlayerTarget(player, payload, state);
	}

	private resolveEnemyPlayerTarget(
		player: PlayerState,
		payload: UseItemAction["payload"],
		state: GameState,
	): { targetPlayerId: string } {
		const targetPlayerId =
			payload.targetPlayerId ??
			(state.currentRound?.status === RoundStatus.IN_PROGRESS &&
			state.currentRound.teamId !== player.teamId
				? state.currentRound.explainerId
				: undefined);

		if (!targetPlayerId) {
			throw new InvalidEffectTargetError("Target player is required");
		}
		const targetPlayer = state.players.find((p) => p.id === targetPlayerId);
		if (!targetPlayer || targetPlayer.teamId === player.teamId) {
			throw new InvalidEffectTargetError("Must target an enemy player");
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
}
