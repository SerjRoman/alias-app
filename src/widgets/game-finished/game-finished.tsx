import { useAuth } from "@entities/auth/model";
import { useGameSlice } from "@entities/game/model";
import { useNavigate } from "react-router-dom";
import winnerImage from "../../assets/winner.jpg";
import { socketClient } from "@shared/api/socket";

export function GameFinished() {
	const { user } = useAuth();
	const { game } = useGameSlice();
	const navigate = useNavigate();

	if (!game || !user) {
		navigate("/games");
		return null;
	}

	return (
		<div>
			<h2>Game Finished</h2>
			<p>Thanks for playing! The game has ended.</p>
			<button onClick={() => navigate("/games")}>
				Back to Game List
			</button>
			{game.ownerId === user.id && (
				<button
					onClick={() => {
						socketClient.emit("deleteGame", { roomId: game.id });
						navigate("/games");
					}}
				>
					Delete game
				</button>
			)}
			<img src={winnerImage} alt="Winner" />
		</div>
	);
}
