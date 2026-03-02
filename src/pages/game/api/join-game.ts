import { type GameStateDetails } from "@entities/game";
import { socketClient } from "@shared/api";

export function joinGame(
	gameId: string,
	code: null | string,
	callback?: (value: GameStateDetails) => void,
) {
	socketClient.emit(
		"joinGame",
		{
			roomId: gameId,
			code: code,
		},
		(data: GameStateDetails) => {
			callback?.(data);
		},
	);
}
