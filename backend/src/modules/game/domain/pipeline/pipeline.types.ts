import type { DomainEvent } from "../events/game.events";
import type { GameAction } from "../actions/game.actions";
import type { GameState } from "../state/game.state";

/**
 * Function type used by pipeline handlers and addons to publish domain events.
 */
export type EmitEventFn = (event: DomainEvent) => void;

/**
 * Transient execution context for a single action.
 * Exists only in memory during dispatch and is discarded afterwards.
 */
export interface ActionContext {
	action: GameAction;
	state: GameState;
	now?: number;
	resolvedWordScore?: number;
	resolvedEffectIds?: string[];
	consumedEffectIds?: string[];
	emit: EmitEventFn;
}

/**
 * Standard synchronous handler in the game engine execution pipeline.
 */
export type GamePipelineHandler = (ctx: ActionContext) => void;
