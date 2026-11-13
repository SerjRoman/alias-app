import { BaseEntity } from "@common/domain/base-entity";
import type { DomainEvent } from "@common/domain/domain-event";
import type {
	GameAction,
	WordGuessedAction,
	WordSkippedAction,
} from "../actions/game.actions";
import {
	NotRoundExplainerError,
	PlayerNotRoomOwnerError,
} from "../errors/game.errors";
import { RoundIsNotPending, RoundNotActiveError } from "../errors/round.errors";
import {
	EffectExpiredDomainEvent,
	GameFinishedDomainEvent,
	GameStartedDomainEvent,
	RoundEndedDomainEvent,
} from "../events/game.events";
import { DEFAULT_GAME_HANDLERS } from "../pipeline/handlers";
import { WordCyclingGuardStrategy } from "../pipeline/handlers/word-cycle";
import type {
	ActionContext,
	GamePipelineHandler,
} from "../pipeline/pipeline.types";
import { runEffectGuards } from "../pipeline/scoring-pipeline";
import { RoundStatus, type GameState } from "../state/game.state";

export { DEFAULT_GAME_HANDLERS };

function syncSettingsDefaults(state: GameState): void {
	if (
		(state.pointsToWin as unknown) === undefined &&
		state.settings?.pointsToWin !== undefined
	) {
		state.pointsToWin = state.settings.pointsToWin;
	}
	if (
		state.roundTimeSeconds === undefined &&
		state.settings?.roundTimeSeconds !== undefined
	) {
		state.roundTimeSeconds = state.settings.roundTimeSeconds;
	}
	if ((state.activeTeamId as unknown) === undefined) {
		state.activeTeamId = state.currentRound?.teamId ?? null;
	}
	state.addons ??= {};
	state.bannedPlayerIds ??= [];
	state.activeEffects ??= [];
}

function buildPlayerToTeamMap(teams: GameState["teams"]): Map<string, string> {
	const playerToTeam = new Map<string, string>();
	for (const team of teams) {
		if (Array.isArray(team.playerIds)) {
			for (const pid of team.playerIds) {
				playerToTeam.set(pid, team.id);
			}
		}
	}
	return playerToTeam;
}

function syncPlayerTeamMappings(state: GameState): void {
	const hasTeamPlayerIds = state.teams.some(
		(t) => Array.isArray(t.playerIds) && t.playerIds.length > 0,
	);
	if (!hasTeamPlayerIds) {
		return;
	}

	const playerToTeam = buildPlayerToTeamMap(state.teams);
	for (const player of state.players) {
		const mappedTeamId = playerToTeam.get(player.id);
		if (mappedTeamId) {
			player.teamId = mappedTeamId;
		} else if (
			player.teamId &&
			state.teams.some(
				(t) => t.id === player.teamId && Array.isArray(t.playerIds),
			)
		) {
			player.teamId = undefined;
		}
	}
}

function syncTeamPlayerLists(state: GameState): void {
	for (const player of state.players) {
		if (!player.teamId) {
			continue;
		}
		const team = state.teams.find((t) => t.id === player.teamId);
		if (
			team &&
			Array.isArray(team.playerIds) &&
			!team.playerIds.includes(player.id)
		) {
			team.playerIds.push(player.id);
		}
	}
}

/**
 * Synchronizes state fields to ensure consistent team/player/round invariants.
 */
function syncInPlaceInterop(state: GameState): void {
	syncSettingsDefaults(state);
	syncPlayerTeamMappings(state);
	syncTeamPlayerLists(state);
}

/**
 * GameEngine is the Aggregate Root that processes game actions through
 * an ordered pipeline of domain handlers.
 */
export class GameEngine extends BaseEntity {
	private readonly _state: GameState;
	private readonly _handlers: GamePipelineHandler[];

	private constructor(state: GameState, handlers: GamePipelineHandler[]) {
		super();
		this._state = state;
		this._handlers = handlers;
	}

	get id(): string {
		return this._state.id;
	}

	get handlers(): readonly GamePipelineHandler[] {
		return this._handlers;
	}

	/**
	 * Returns the current live game state snapshot.
	 */
	public getState(): GameState {
		return this._state;
	}

	/**
	 * Returns a deep copy of the game state for serialization / caching.
	 */
	public toPrimitives(): GameState {
		syncInPlaceInterop(this._state);
		const clone = structuredClone(this._state);

		for (const team of clone.teams) {
			const assignedIds = clone.players
				.filter((p) => p.teamId === team.id)
				.map((p) => p.id);
			const existingIds = Array.isArray(team.playerIds)
				? team.playerIds.filter((id) =>
						clone.players.some((p) => p.id === id),
					)
				: [];
			team.playerIds = Array.from(
				new Set([...existingIds, ...assignedIds]),
			);
			team.lastExplainerId = team.lastExplainerId ?? null;
		}

		for (const player of clone.players) {
			player.score = player.score ?? 0;
			player.isRoundReady = player.isRoundReady ?? false;
			player.isOnline = player.isOnline ?? true;
			player.role = player.role ?? "anonymous";
			player.submittedWordsCount = player.submittedWordsCount ?? 0;
		}

		if (clone.currentRound) {
			clone.currentRound.pausedAt = clone.currentRound.pausedAt ?? null;
			clone.currentRound.remainingMs =
				clone.currentRound.remainingMs ?? null;
		}

		clone.leftPlayers = clone.leftPlayers ?? [];
		clone.ownerOfflineSince = clone.ownerOfflineSince ?? null;
		clone.winnerTeamId = clone.winnerTeamId ?? null;
		clone.lastTeamPlayedIndex =
			clone.lastTeamPlayedIndex ??
			(clone.activeTeamId
				? clone.teams.findIndex((t) => t.id === clone.activeTeamId)
				: -1);
		clone.createdAt = clone.createdAt ?? Date.now();
		clone.nextRoundNumber =
			clone.nextRoundNumber ??
			(clone.currentRound ? clone.currentRound.roundNumber + 1 : 1);
		clone.spectators = clone.spectators ?? [];
		clone.bannedPlayerIds = clone.bannedPlayerIds ?? [];
		clone.activeEffects = clone.activeEffects ?? [];

		return clone;
	}

	/**
	 * Dispatches an action to the domain pipeline.
	 * Instantiates a transient ActionContext, executes all registered handlers sequentially,
	 * mutates the state, and records domain events.
	 */
	public dispatch(
		action: GameAction,
		now: number = Date.now(),
	): {
		state: GameState;
		context: ActionContext;
	} {
		syncInPlaceInterop(this._state);

		const pendingEvents: DomainEvent[] = [];

		// Phase 1: Execute active effect guards & auto-expire time-based effects
		runEffectGuards(
			action,
			this._state.activeEffects,
			now,
			(event: DomainEvent) => pendingEvents.push(event),
			this._state.id,
		);

		const ctx: ActionContext = {
			action,
			state: this._state,
			now,
			emit: (event: DomainEvent) => pendingEvents.push(event),
		};

		for (const handler of this._handlers) {
			handler(ctx);
		}

		syncInPlaceInterop(this._state);
		const primitivesSnapshot = this.toPrimitives();

		for (const event of pendingEvents) {
			if (
				event instanceof GameStartedDomainEvent ||
				event instanceof RoundEndedDomainEvent ||
				event instanceof GameFinishedDomainEvent ||
				event instanceof EffectExpiredDomainEvent
			) {
				if (!event.gameState?.id) {
					event.gameState = primitivesSnapshot;
				}
			}
			this.addDomainEvent(event);

			if (
				event instanceof RoundEndedDomainEvent &&
				event.isGameFinished
			) {
				this.addDomainEvent(
					new GameFinishedDomainEvent(
						this._state.id,
						this._state.winnerTeamId ?? null,
						this._state.teams,
						primitivesSnapshot,
					),
				);
			}
		}

		return {
			state: this._state,
			context: ctx,
		};
	}

	/**
	 * Pre-validates whether a round can be started by the given actor before external side effects (e.g. popping a word).
	 */
	public assertCanStartRound(
		actorId: string,
		force: boolean = false,
		now: number = Date.now(),
	): void {
		syncInPlaceInterop(this._state);
		runEffectGuards(
			{
				type: "START_ROUND",
				actorId,
				payload: { durationSeconds: 0, force },
			},
			this._state.activeEffects,
			now,
		);

		const round = this._state.currentRound;
		if (!round) {
			throw new RoundNotActiveError();
		}
		if (round.status !== RoundStatus.PENDING) {
			throw new RoundIsNotPending(
				"Round can only be started when PENDING",
			);
		}

		const explainerId = round.explainerId;
		if (force) {
			if (actorId !== this._state.ownerId) {
				throw new PlayerNotRoomOwnerError();
			}
		} else if (
			actorId &&
			actorId !== explainerId &&
			actorId !== this._state.ownerId
		) {
			throw new NotRoundExplainerError(
				"Only the designated explainer or room owner can start the round",
			);
		}
	}

	/**
	 * Pre-validates whether the given actor can cycle the current word before external side effects (e.g. popping a word).
	 */
	public assertCanCycleWord(
		actorId: string,
		actionType: "WORD_GUESSED" | "WORD_SKIPPED",
		now: number = Date.now(),
	): void {
		syncInPlaceInterop(this._state);
		const action: WordGuessedAction | WordSkippedAction = {
			type: actionType,
			actorId,
			payload: { nextWordText: "" },
		};
		runEffectGuards(action, this._state.activeEffects, now);

		const guard = new WordCyclingGuardStrategy();
		guard.handle(action, {
			action,
			state: this._state,
			now,
			emit: () => {},
		});
	}

	/**
	 * Expires an active effect by its unique ID, removing it from activeEffects and emitting EffectExpiredDomainEvent.
	 */
	public expireEffect(effectId: string, now: number = Date.now()): void {
		this.dispatch(
			{
				type: "EXPIRE_EFFECT",
				actorId: "system",
				payload: { effectId },
			},
			now,
		);
	}

	/**
	 * Factory method to initialize a new GameEngine instance with initial lobby state.
	 */
	public static create(
		id: string,
		ownerId: string,
		options?: Partial<GameState>,
		customHandlers?: GamePipelineHandler[],
	): GameEngine {
		const initialState: GameState = {
			id,
			ownerId,
			status: "LOBBY",
			pointsToWin: options?.pointsToWin ?? 30,
			teams: options?.teams ?? [],
			players: options?.players ?? [],
			bannedPlayerIds: options?.bannedPlayerIds ?? [],
			spectators: options?.spectators ?? [],
			leftPlayers: options?.leftPlayers ?? [],
			ownerOfflineSince: options?.ownerOfflineSince ?? null,
			activeTeamId: null,
			currentRound: null,
			activeEffects: options?.activeEffects ?? [],
			createdAt: options?.createdAt ?? Date.now(),
			addons: options?.addons ?? {},
			...options,
		};

		const activeHandlers = customHandlers ?? [...DEFAULT_GAME_HANDLERS];
		return new GameEngine(initialState, activeHandlers);
	}

	/**
	 * Restores a GameEngine instance from a persisted state snapshot (e.g. from Redis).
	 */
	public static fromPrimitives(
		state: GameState,
		customHandlers?: GamePipelineHandler[],
	): GameEngine {
		syncInPlaceInterop(state);
		const activeHandlers = customHandlers ?? [...DEFAULT_GAME_HANDLERS];
		return new GameEngine(state, activeHandlers);
	}
}
