import { CreateGameForm } from "./create-game/create-game";
import styles from "./page.module.css";
import { RefreshCcw } from "lucide-react";
import { useMutation, useQuery } from "@shared/api";
import { GameList, type GameState } from "@entities/game";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@entities/auth";
import { Button } from "@shared/ui/button";
import { useTranslation } from "react-i18next";
import { Assistant, useAssistant } from "@shared/ui";
import { useUserSettings } from "@entities/user-profile";

export function GamesPage() {
	const {
		data: games,
		isLoading,
		refetch,
		isFetching,
	} = useQuery(
		"get",
		"/games",
		{
			headers: { "ngrok-skip-browser-warning": "true" },
		},
		{ refetchInterval: 30000 },
	);
	const { t } = useTranslation();
	const { isAssistantDisabled } = useUserSettings();
	const assistantState = useAssistant(t("games.assistant.availableGames"));

	const sortedGames = games
		? [...games].sort(
				(a, b) =>
					new Date(b.createdAt).getTime() -
					new Date(a.createdAt).getTime(),
			)
		: [];
	const { token } = useAuth();
	const navigate = useNavigate();
	const { mutate: validateCode } = useMutation(
		"post",
		"/games/validate-code",
	);
	async function handleJoin(game: GameState, code: string | null) {
		if (game.settings.isPrivate) {
			if (!code || code.length === 0) {
				return t("games.accessCodeRequired");
			}
			validateCode(
				{
					body: {
						code,
						roomId: game.id,
					},
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
				{
					onSuccess: ({ valid }) => {
						if (!valid) {
							return t("games.invalidCode");
						}
						const c: string =
							!code || code.length === 0 ? "" : `&code=${code}`;
						navigate(`/game?id=${game.id}${c}`);
					},
					onError() {
						return t("games.failedToValidateCode");
					},
				},
			);
		} else {
			navigate(`/game?id=${game.id}`);
		}
	}
	return (
		<div className={styles.pageContainer}>
			<div className={styles.sectionList}>
				<h2 className={styles.sectionTitle}>{t("games.available")}</h2>
				<Button
					className={styles.refreshButton}
					onClick={() => refetch()}
					disabled={isFetching}
					title={t("games.updateList")}
				>
					{isFetching ? t("games.updating") : t("games.refresh")}
					<RefreshCcw
						size={18}
						className={isFetching ? styles.spinning : undefined}
					/>
				</Button>

				{isLoading ? (
					<div>{t("games.loading")}</div>
				) : (
					games && (
						<GameList
							games={sortedGames as GameState[]}
							onJoin={handleJoin}
							showAssistant={assistantState.show}
						/>
					)
				)}
			</div>
			<CreateGameForm showAssistant={assistantState.show} />
			{!isAssistantDisabled && <Assistant {...assistantState} />}
		</div>
	);
}
