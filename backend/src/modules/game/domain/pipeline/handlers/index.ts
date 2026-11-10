import { gameLifecycleHandler } from "./game-lifecycle.handler";
import { lobbyHandler } from "./lobby.handler";
import { roundFlowHandler } from "./round-flow.handler";
import { scoringHandler } from "./scoring.handler";
import { wordCycleHandler } from "./word-cycle.handler";
import type { GamePipelineHandler } from "../pipeline.types";

export {
	lobbyHandler,
	gameLifecycleHandler,
	roundFlowHandler,
	scoringHandler,
	wordCycleHandler,
};

export const DEFAULT_GAME_HANDLERS: readonly GamePipelineHandler[] =
	Object.freeze([
		lobbyHandler,
		gameLifecycleHandler,
		roundFlowHandler,
		scoringHandler,
		wordCycleHandler,
	]);
