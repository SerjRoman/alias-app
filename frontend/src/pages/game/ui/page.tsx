import { useGameSession } from "../api/use-game-session";
import { useSearchParams } from "react-router-dom";
import { LobbyView } from "@pages/game/ui/lobby";
import styles from "./page.module.css";
import { Blocks } from "react-loader-spinner";
import { useKickHandler } from "../api/use-kick-handler";
import { useAuth } from "@entities/auth";
import {
	GameVoiceRenderer,
	useGameSync,
	useGameShortcuts,
	useGameVoice,
} from "@entities/game";
import { ActiveGameView } from "@pages/game/ui/active-game";
import { GameFinished } from "@pages/game/ui/game-finished";
import { useEffect, useState, useRef } from "react";
import { AdminPanel } from "./admin-panel/admin-panel";
import { Settings } from "lucide-react";
import { Button, Tooltip, Assistant, useAssistant } from "@shared/ui";
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import { useQuery } from "@shared/api";
import { useTranslation } from "react-i18next";
import { useGameAssistant } from "../api";
import { AudioHandlingWrapper } from "./audio-handling-wrapper";
import { FloatingVoiceControl } from "./floating-voice-control";
import { useUserSettings } from "@entities/user-profile";

export function GamePage() {
	const { t } = useTranslation();
	const [searchParams] = useSearchParams();
	const roomId = searchParams.get("id");
	const code = searchParams.get("code");
	const { game, isLoading } = useGameSession(roomId, code);
	const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
	const [isVoiceConnected, setIsVoiceConnected] = useState(true);

	const { setVoiceToken, voiceToken, clearVoiceToken } = useGameVoice();
	const { data } = useQuery(
		"get",
		"/games/{id}/voice-token",
		{
			params: {
				path: {
					id: game?.id || roomId || "",
				},
			},
		},
		{
			enabled:
				!!game?.settings.isVoiceChatEnabled && !!(game?.id || roomId),
		},
	);
	const liveKitUrl = import.meta.env.VITE_LIVEKIT_URL;

	const { user } = useAuth();
	useGameSync();
	useKickHandler();
	useEffect(() => {
		if (!game?.settings.isVoiceChatEnabled) {
			clearVoiceToken();
			return;
		}
		if (data?.token && data.token !== voiceToken) {
			setVoiceToken(data.token);
		}
	}, [
		data,
		setVoiceToken,
		voiceToken,
		game?.settings.isVoiceChatEnabled,
		clearVoiceToken,
	]);

	useEffect(() => {
		return () => {
			clearVoiceToken();
		};
	}, [clearVoiceToken]);
	useGameShortcuts({
		onAdminMenuToggle: () => setIsAdminMenuOpen((prev) => !prev),
	});
	const { isAssistantDisabled } = useUserSettings();
	const assistantMessage = useGameAssistant(game, user?.id || "");
	const assistantState = useAssistant(assistantMessage);
	const hasVoice = !!(voiceToken && game?.settings.isVoiceChatEnabled);

	const prevVoiceConnectedRef = useRef(false);
	useEffect(() => {
		const isCurrentlyConnected = hasVoice && isVoiceConnected;
		if (isCurrentlyConnected && !prevVoiceConnectedRef.current && !isAssistantDisabled) {
			assistantState.show(
				{
					text: t("voice.connectedTip"),
					variant: "success",
					priority: "high",
				},
				{ duration: 8000 }
			);
		}
		prevVoiceConnectedRef.current = isCurrentlyConnected;
	}, [hasVoice, isVoiceConnected, isAssistantDisabled, assistantState, t]);

	if (isLoading || !user) {
		return (
			<div className={styles.loading}>
				<Blocks
					height="80"
					width="80"
					ariaLabel="blocks-loading"
					visible={true}
				/>
			</div>
		);
	}
	if (!game) {
		return <div>{t("games.noSuchGame")}</div>;
	}

	const isAdmin = game.ownerId === user.id;

	const view = {
		LOBBY: <LobbyView />,
		IN_PROGRESS: <ActiveGameView />,
		FINISHED: <GameFinished />,
	};
	const currentView = view[game.status];

	const mainContent = (
		<div className={`${styles.page} ${hasVoice ? styles.hasVoice : ""}`}>
			{isAdmin && (
				<>
					{!isAdminMenuOpen && (
						<Tooltip
							text={t("tooltips.settingsToggle")}
							position="left"
							className={styles.adminToggleContainer}
						>
							<Button
								className={`${styles.adminToggle}`}
								onClick={() =>
									setIsAdminMenuOpen(!isAdminMenuOpen)
								}
							>
								<Settings />
							</Button>
						</Tooltip>
					)}

					{isAdminMenuOpen && (
						<div className={`${styles.sideMenu}`}>
							<div className={styles.sideMenuContent}>
								<AdminPanel
									game={game}
									onClose={() => setIsAdminMenuOpen(false)}
								/>
							</div>
						</div>
					)}
				</>
			)}

			<div className={styles.container}>
				<h1 className={styles.title}>{game.settings.name}</h1>
				{currentView}
			</div>

			{hasVoice && (
				<FloatingVoiceControl
					isConnected={isVoiceConnected}
					setIsConnected={setIsVoiceConnected}
				/>
			)}

			{!isAssistantDisabled && <Assistant {...assistantState} />}
		</div>
	);

	if (hasVoice) {
		return (
			<LiveKitRoom
				token={voiceToken}
				serverUrl={liveKitUrl}
				connect={isVoiceConnected}
				audio={true}
				video={false}
			>
				<AudioHandlingWrapper>
					<GameVoiceRenderer />
					{mainContent}
				</AudioHandlingWrapper>
			</LiveKitRoom>
		);
	}

	return mainContent;
}


