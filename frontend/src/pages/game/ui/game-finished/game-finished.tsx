import { useNavigate } from "react-router-dom";
import winnerImage from "../../../../assets/winner.jpg";
import { socketClient } from "@shared/api";
import { useAuth } from "@entities/auth";
import { useGameSlice } from "@entities/game";
import { Button } from "@shared/ui";
import { useTranslation } from "react-i18next";

export function GameFinished() {
	const { t } = useTranslation();
	const { user } = useAuth();
	const { game } = useGameSlice();
	const navigate = useNavigate();

	if (!game || !user) {
		navigate("/games");
		return null;
	}

	return (
		<div>
			<h2>{t("gameFinished.title")}</h2>
			<p>{t("gameFinished.description")}</p>
			<Button onClick={() => navigate("/games")}>
				{t("gameFinished.backToList")}
			</Button>
			{game.ownerId === user.id && (
				<Button
					variant="danger"
					onClick={() => {
						socketClient.emit("deleteGame", { roomId: game.id });
						navigate("/games");
					}}
				>
					{t("gameFinished.deleteGame")}
				</Button>
			)}
			<img src={winnerImage} alt="Winner" />
		</div>
	);
}
