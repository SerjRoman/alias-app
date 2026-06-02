import { useGameSession } from "../api/use-game-session";
import { useSearchParams } from "react-router-dom";
import { LobbyView } from "@pages/game/ui/lobby";
import styles from "./page.module.css";
import { Blocks } from "react-loader-spinner";
import { useKickHandler } from "../api/use-kick-handler";
import { useAuth } from "@entities/auth";
import { GameVoiceRenderer, useGameSync } from "@entities/game";
import { ActiveGameView } from "@pages/game/ui/active-game";
import { GameFinished } from "@pages/game/ui/game-finished";
import { useEffect, useState } from "react";
import { AdminPanel } from "./admin-panel/admin-panel";
import { Settings } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
	LiveKitRoom,
	StartAudio,
	useAudioPlayback,
	ControlBar,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { useGameVoice } from "@entities/game/model";
import { useQuery } from "@shared/api";
import { useTranslation } from "react-i18next";

function AudioHandlingWrapper({ children }: { children: React.ReactNode }) {
	const { canPlayAudio, startAudio } = useAudioPlayback();
    const {t} = useTranslation();
	useEffect(() => {
		const handleFirstInteraction = () => {
			if (!canPlayAudio) {
				startAudio().catch(console.error);
			}
		};
		window.addEventListener("click", handleFirstInteraction);
		return () =>
			window.removeEventListener("click", handleFirstInteraction);
	}, [canPlayAudio, startAudio]);

	return (
		<>
			{!canPlayAudio && (
				<div className={styles.audioPrompt}>
					<div className={styles.audioPromptContent}>
						<p>{t("audio.prompt")}</p>
						<StartAudio label={t("audio.enable")} />
					</div>
				</div>
			)}
			{children}
		</>
	);
}

export function GamePage() {
	const [searchParams] = useSearchParams();
	const roomId = searchParams.get("id");
	const code = searchParams.get("code");
	const { game, isLoading } = useGameSession(roomId, code);
	const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

	const { setVoiceToken, voiceToken, clearVoiceToken } = useGameVoice();
	const { data } = useQuery("get", "/games/{id}/voice-token", {
		params: {
			path: {
				id: game?.id || roomId || "",
			},
		},
	}, {
		enabled: !!game?.settings.isVoiceChatEnabled && !!(game?.id || roomId),
	});
	const liveKitUrl =
		import.meta.env.VITE_LIVEKIT_URL

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
	}, [data, setVoiceToken, voiceToken, game?.settings.isVoiceChatEnabled, clearVoiceToken]);

	useEffect(() => {
		return () => {
			clearVoiceToken();
		};
	}, [clearVoiceToken]);

	if (isLoading || !user) {
		return (
			<div className={styles.page}>
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
		return <div>No such game. Go back to game list</div>;
	}

	const isAdmin = game.ownerId === user.id;

	const view = {
		LOBBY: <LobbyView />,
		IN_PROGRESS: <ActiveGameView />,
		FINISHED: <GameFinished />,
	};
	return (
		<div className={styles.page}>
			{isAdmin && (
				<>
					{!isAdminMenuOpen && (
						<Button
							className={`${styles.adminToggle}`}
							onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
						>
							<Settings />
						</Button>
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

				{voiceToken && game.settings.isVoiceChatEnabled ? (
					<LiveKitRoom
						token={voiceToken}
						serverUrl={liveKitUrl}
						connect={true}
						audio={true}
						video={false}
					>
						<AudioHandlingWrapper>
							<GameVoiceRenderer />
							<div style={{ marginBottom: "1rem" }}>
								<ControlBar />
							</div>
							{view[game.status]}
						</AudioHandlingWrapper>
					</LiveKitRoom>
				) : (
					view[game.status]
				)}
			</div>
		</div>
	);
}
