import { ActionDispatcher } from "../../../dispatcher/action-dispatcher";
import type { GamePipelineHandler } from "../../pipeline.types";
import { BuyItemStrategy } from "./buy-item.strategy";
import { UseItemStrategy } from "./use-item.strategy";
import { ExpireEffectStrategy } from "./expire-effect.strategy";

export * from "./buy-item.strategy";
export * from "./use-item.strategy";
export * from "./expire-effect.strategy";

export const shopDispatcher = new ActionDispatcher().registerAll([
	new BuyItemStrategy(),
	new UseItemStrategy(),
	new ExpireEffectStrategy(),
]);

export const shopHandler: GamePipelineHandler = shopDispatcher.asHandler();
