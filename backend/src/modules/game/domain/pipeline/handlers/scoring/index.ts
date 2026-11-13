import { ActionDispatcher } from "../../../dispatcher/action-dispatcher";
import type { GamePipelineHandler } from "../../pipeline.types";
import { WordScoringStrategy } from "./word-scoring.strategy";
import { WordCyclingGuardStrategy } from "../word-cycle";

export * from "./word-scoring.strategy";

export const scoringDispatcher = new ActionDispatcher().registerAll([
	new WordCyclingGuardStrategy(),
	new WordScoringStrategy(),
]);

export const scoringHandler: GamePipelineHandler =
	scoringDispatcher.asHandler();
