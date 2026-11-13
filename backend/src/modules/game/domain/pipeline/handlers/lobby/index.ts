import { ActionDispatcher } from "../../../dispatcher/action-dispatcher";
import type { GamePipelineHandler } from "../../pipeline.types";
import {
	AddTeamStrategy,
	DeleteTeamStrategy,
	MoveToTeamStrategy,
	MoveToSpectatorsStrategy,
} from "./lobby-teams.strategies";
import {
	JoinGameStrategy,
	LeaveGameStrategy,
	KickPlayerStrategy,
	ToggleReadyStrategy,
	SetPlayerOfflineStrategy,
	ShufflePlayersStrategy,
} from "./lobby-players.strategies";
import {
	TransferOwnershipStrategy,
	UpdateSettingsStrategy,
	SubmitCustomWordsStrategy,
} from "./lobby-settings.strategies";

export * from "./lobby.helpers";
export * from "./lobby-teams.strategies";
export * from "./lobby-players.strategies";
export * from "./lobby-settings.strategies";

export const lobbyDispatcher = new ActionDispatcher().registerAll([
	new JoinGameStrategy(),
	new LeaveGameStrategy(),
	new SetPlayerOfflineStrategy(),
	new TransferOwnershipStrategy(),
	new UpdateSettingsStrategy(),
	new SubmitCustomWordsStrategy(),
	new AddTeamStrategy(),
	new DeleteTeamStrategy(),
	new MoveToTeamStrategy(),
	new MoveToSpectatorsStrategy(),
	new ShufflePlayersStrategy(),
	new ToggleReadyStrategy(),
	new KickPlayerStrategy(),
]);

export const lobbyHandler: GamePipelineHandler = lobbyDispatcher.asHandler();
