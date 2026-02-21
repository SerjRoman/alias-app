import {
	useGameSlice,
	type GameStateDetails,
} from "../../../entities/game/model";
import { socketClient } from "../../../shared/api/socket";

export function joinGame(
	gameId: string,
	code: null | string,
	callback?: (value: GameStateDetails) => void,
) {
	const setGameState = useGameSlice.setState;
	socketClient.emit(
		"joinGame",
		{
			roomId: gameId,
			code: code,
		},
		(data: GameStateDetails) => {
			setGameState({ game: data });
			console.log(data);
			callback?.(data);
		},
	);
}
