import { ActionDispatcher } from "../../../dispatcher/action-dispatcher";
import type { GamePipelineHandler } from "../../pipeline.types";
import { ToggleRoundReadyStrategy } from "./toggle-round-ready.strategy";
import { SetExplainerStrategy } from "./set-explainer.strategy";
import { ChangeRoundTimeStrategy } from "./change-round-time.strategy";
import {
	StartPointingStrategy,
	ChangeWordScoreStrategy,
	EndPointingStrategy,
} from "./round-pointing.strategies";
import { StartRoundStrategy } from "./start-round.strategy";
import { NextRoundStrategy } from "./next-round.strategy";
import {
	PauseRoundStrategy,
	ResumeRoundStrategy,
} from "./round-pause.strategies";
import { AwardRoundCoinsStrategy } from "../economy/award-round-coins.strategy";

export * from "./round.helpers";
export * from "./toggle-round-ready.strategy";
export * from "./set-explainer.strategy";
export * from "./change-round-time.strategy";
export * from "./round-pointing.strategies";
export * from "./start-round.strategy";
export * from "./next-round.strategy";
export * from "./round-pause.strategies";

export const roundFlowDispatcher = new ActionDispatcher().registerAll([
	new ToggleRoundReadyStrategy(),
	new SetExplainerStrategy(),
	new ChangeRoundTimeStrategy(),
	new StartRoundStrategy(),
	new StartPointingStrategy(),
	new ChangeWordScoreStrategy(),
	new EndPointingStrategy(),
	new AwardRoundCoinsStrategy(),
	new NextRoundStrategy(),
	new PauseRoundStrategy(),
	new ResumeRoundStrategy(),
]);

export const roundFlowHandler: GamePipelineHandler =
	roundFlowDispatcher.asHandler();
