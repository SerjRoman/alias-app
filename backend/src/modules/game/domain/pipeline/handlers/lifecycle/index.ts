import { ActionDispatcher } from "../../../dispatcher/action-dispatcher";
import type { GamePipelineHandler } from "../../pipeline.types";
import {
	StartGameStrategy,
	EndGameStrategy,
	DeleteGameStrategy,
} from "./lifecycle.strategies";

export * from "./lifecycle.strategies";

export const gameLifecycleDispatcher = new ActionDispatcher().registerAll([
	new StartGameStrategy(),
	new EndGameStrategy(),
	new DeleteGameStrategy(),
]);

export const gameLifecycleHandler: GamePipelineHandler =
	gameLifecycleDispatcher.asHandler();
