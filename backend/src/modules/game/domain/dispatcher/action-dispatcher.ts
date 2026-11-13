import type { GameAction } from "../actions/game.actions";
import type {
	ActionContext,
	GamePipelineHandler,
} from "../pipeline/pipeline.types";

/**
 * Functional handler for a specific domain action.
 */
export type ActionStrategyFn<TAction extends GameAction = GameAction> = (
	action: TAction,
	ctx: ActionContext,
) => void;

/**
 * Object-oriented strategy interface for handling one or multiple action types.
 */
export interface ActionStrategy<TAction extends GameAction = GameAction> {
	readonly actionType: TAction["type"] | readonly TAction["type"][];
	handle(action: TAction, ctx: ActionContext): void;
}

/**
 * Registry and dispatcher of action strategies.
 * Routes actions in O(1) time to one or more registered strategies.
 */
export class ActionDispatcher {
	private readonly strategies = new Map<
		string,
		Array<(action: any, ctx: ActionContext) => void>
	>();

	/**
	 * Registers a functional strategy for a given action type.
	 */
	public register<TAction extends GameAction>(
		actionType: TAction["type"],
		handler: ActionStrategyFn<TAction>,
	): this;

	/**
	 * Registers an ActionStrategy instance.
	 */
	public register<TAction extends GameAction>(
		strategy: ActionStrategy<TAction>,
	): this;

	public register<TAction extends GameAction>(
		first: TAction["type"] | ActionStrategy<TAction>,
		second?: ActionStrategyFn<TAction>,
	): this {
		if (
			typeof first === "object" &&
			first !== null &&
			"actionType" in first
		) {
			const strategy = first;
			const fn = (action: TAction, ctx: ActionContext) =>
				strategy.handle(action, ctx);
			const actionTypes: readonly string[] = Array.isArray(
				strategy.actionType,
			)
				? (strategy.actionType as readonly string[])
				: [strategy.actionType as string];

			for (const type of actionTypes) {
				const existing = this.strategies.get(type) ?? [];
				existing.push(fn);
				this.strategies.set(type, existing);
			}
			return this;
		}

		const actionType = first;
		const fn = second;
		if (fn) {
			const existing = this.strategies.get(actionType) ?? [];
			existing.push(fn);
			this.strategies.set(actionType, existing);
		}
		return this;
	}

	/**
	 * Registers multiple ActionStrategy objects.
	 */
	public registerAll(strategies: Array<ActionStrategy<any>>): this {
		for (const strategy of strategies) {
			this.register(strategy);
		}
		return this;
	}

	/**
	 * Dispatches an action from the ActionContext to all matching strategies.
	 * Returns true if at least one strategy handled the action, false otherwise.
	 */
	public dispatch(ctx: ActionContext): boolean {
		const list = this.strategies.get(ctx.action.type);
		if (!list || list.length === 0) {
			return false;
		}
		for (const fn of list) {
			fn(ctx.action, ctx);
		}
		return true;
	}

	/**
	 * Converts the dispatcher into a standard GamePipelineHandler function
	 * compatible with the existing GameEngine execution pipeline.
	 */
	public asHandler(): GamePipelineHandler {
		return (ctx: ActionContext) => {
			this.dispatch(ctx);
		};
	}
}
