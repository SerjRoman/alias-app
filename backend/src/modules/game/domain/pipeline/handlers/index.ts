import { gameLifecycleHandler } from "./lifecycle";
import { lobbyHandler } from "./lobby";
import { roundFlowHandler } from "./round";
import { scoringHandler } from "./scoring";
import { effectsHandler } from "./effects";
import { wordCycleGuardHandler, wordCycleHandler } from "./word-cycle";
import { shopHandler } from "./shop";
import type { GamePipelineHandler } from "../pipeline.types";

export {
	lobbyHandler,
	gameLifecycleHandler,
	roundFlowHandler,
	wordCycleGuardHandler,
	scoringHandler,
	effectsHandler,
	wordCycleHandler,
	shopHandler,
};

export const DEFAULT_GAME_HANDLERS: readonly GamePipelineHandler[] =
	Object.freeze([
		lobbyHandler,
		gameLifecycleHandler,
		roundFlowHandler,
		wordCycleGuardHandler,
		scoringHandler,
		effectsHandler,
		wordCycleHandler,
		shopHandler,
	]);
