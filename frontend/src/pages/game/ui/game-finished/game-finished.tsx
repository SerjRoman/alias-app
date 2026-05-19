import { useNavigate } from "react-router-dom";
import winnerImage from "../../../../assets/winner.jpg";
import { socketClient } from "@shared/api";
import { useAuth } from "@entities/auth";
import { useGameSlice } from "@entities/game";
import { Button } from "@shared/ui";

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
			<Button onClick={() => navigate("/games")}>
				Back to Game List
			</Button>
			{game.ownerId === user.id && (
				<Button
					variant="danger"
					onClick={() => {
						socketClient.emit("deleteGame", { roomId: game.id });
						navigate("/games");
					}}
				>
					Delete game
				</Button>
			)}
			<img src={winnerImage} alt="Winner" />
		</div>
	);
}
