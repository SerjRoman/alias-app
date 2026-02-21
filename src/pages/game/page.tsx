import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { joinGame } from "../../features/join-game";
import {
	useGameSlice,
	type GameSettings,
	type GameStateDetails,
	type PlayerState,
	type TeamState,
} from "../../entities/game/model";
import { useAuth } from "../../entities/auth/model";
import { Loader2 } from "lucide-react";
import { LobbyView } from "./lobby-view/lobby-view";
import { socketClient } from "../../shared/api/socket";

export function GamePage() {
	const [searchParams] = useSearchParams();
	const { game, clearGame } = useGameSlice();
	const { user } = useAuth();
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const { updatePlayers, updateTeams, updateSettings, setGameState } =
		useGameSlice();
	const gameRef = useRef(game);

	useEffect(() => {
		gameRef.current = game;
	}, [game]);

	useEffect(() => {
		return () => {
			const currentGame = gameRef.current;
			if (currentGame?.id) {
				socketClient.emit("leaveGame", { roomId: currentGame.id });
				clearGame();
			}
		};
	}, []);

	useEffect(() => {
		const roomId = searchParams.get("id");
		const code = searchParams.get("code");

		if (game?.id === roomId) {
			setIsLoading(false);
			return;
		}

		if (roomId) {
			joinGame(roomId, code, () => {
				setIsLoading(false);
			});
		}
	}, [searchParams, game?.id]);

	useEffect(() => {
		function handleUpdateTeams(data: TeamState[]) {
			updateTeams(data);
		}
		function handleUpdatePlayers(data: PlayerState[]) {
			updatePlayers(data);
		}
		function handleUpdateGame(data: GameStateDetails) {
			setGameState(data);
		}
		function updateGameSettings(data: GameSettings) {
			updateSettings(data);
		}
		socketClient.on("playersUpdated", handleUpdatePlayers);
		socketClient.on("teamsUpdated", handleUpdateTeams);
		socketClient.on("gameUpdated", handleUpdateGame);
		socketClient.on("updateGameSettings", updateGameSettings);
		return () => {
			socketClient.off("playersUpdated", handleUpdatePlayers);
			socketClient.off("teamsUpdated", handleUpdateTeams);
			socketClient.off("gameUpdated", handleUpdateGame);
			socketClient.off("updateGameSettings", updateGameSettings);
		};
	}, [setGameState, updatePlayers, updateTeams, updateSettings]);

	if (isLoading || !user) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					marginTop: 50,
				}}
			>
				<Loader2 className="animate-spin" size={48} />
			</div>
		);
	}
	if (!game) {
		return <div>No such game. Go back to game list</div>;
	}

	const isOwner = game.ownerId === user.id;

	return (
		<div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
			<h1 style={{ textAlign: "center", marginBottom: 10 }}>
				{game.settings.name}
			</h1>

			{game.status === "LOBBY" ? (
				<LobbyView game={game} isOwner={isOwner} userId={user.id} />
			) : (
				<GameView />
			)}
		</div>
	);
}

function GameView() {
	return <div>Игра идет! Текущий раунд...</div>;
}
