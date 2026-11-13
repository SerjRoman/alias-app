import { ActionDispatcher } from "../../../dispatcher/action-dispatcher";
import type { GamePipelineHandler } from "../../pipeline.types";
import {
	ActivateArmedEffectsStrategy,
	ConsumeEffectChargeStrategy,
	ConsumeRoundEffectsStrategy,
} from "./effects-lifecycle.strategies";
import {
	PauseEffectsStrategy,
	ResumeEffectsStrategy,
} from "./effects-pause.strategies";

export * from "./effects-lifecycle.strategies";
export * from "./effects-pause.strategies";

export const effectsDispatcher = new ActionDispatcher().registerAll([
	new ActivateArmedEffectsStrategy(),
	new ConsumeEffectChargeStrategy(),
	new ConsumeRoundEffectsStrategy(),
	new PauseEffectsStrategy(),
	new ResumeEffectsStrategy(),
]);

export const effectsHandler: GamePipelineHandler =
	effectsDispatcher.asHandler();
