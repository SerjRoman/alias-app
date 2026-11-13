import { ActionDispatcher } from "../../../dispatcher/action-dispatcher";
import type { GamePipelineHandler } from "../../pipeline.types";
import {
	WordCyclingGuardStrategy,
	WordCycleStrategy,
} from "./word-cycle.strategies";

export * from "./word-cycle.strategies";

export const wordCycleGuardDispatcher = new ActionDispatcher().registerAll([
	new WordCyclingGuardStrategy(),
]);

export const wordCycleGuardHandler: GamePipelineHandler =
	wordCycleGuardDispatcher.asHandler();

export const wordCycleDispatcher = new ActionDispatcher().registerAll([
	new WordCycleStrategy(),
]);

export const wordCycleHandler: GamePipelineHandler =
	wordCycleDispatcher.asHandler();
