import React, { useState } from "react";
import {
	Mic,
	MicOff,
	Headphones,
	VolumeX,
	Settings,
	Radio,
} from "lucide-react";
import type { GameStateDetails, TeamState } from "@entities/game";
import { getDynamicTeamColor } from "../../../api/game-stubs";
import styles from "./voice-dock.module.css";

interface VoiceDockProps {
	game: GameStateDetails;
	pingMs?: number;
	isConnected?: boolean;
	onToggleMic?: (isMuted: boolean) => void;
	onToggleDeafen?: (isDeafened: boolean) => void;
}

interface SpeakerInfo {
	id: string;
	name: string;
	teamName: string;
	teamColor: string;
}

export function VoiceDock({
	game,
	pingMs = 24,
	isConnected = true,
	onToggleMic,
	onToggleDeafen,
}: Readonly<VoiceDockProps>) {
	const [isMuted, setIsMuted] = useState(false);
	const [isDeafened, setIsDeafened] = useState(false);
	const [showSettingsNotice, setShowSettingsNotice] = useState(false);

	const handleMicToggle = () => {
		const nextState = !isMuted;
		setIsMuted(nextState);
		onToggleMic?.(nextState);
	};

	const handleDeafenToggle = () => {
		const nextState = !isDeafened;
		setIsDeafened(nextState);
		onToggleDeafen?.(nextState);
	};

	// Determine active speakers dynamically from game teams/players
	const activeSpeakers: SpeakerInfo[] = [];

	// Speaker 1: Explainer (e.g. Ivan)
	const activeTurnTeam = game.teams.find((t) => t.id === game.currentRound?.teamId) ?? game.teams[0];
	const activeTurnTeamColor = getDynamicTeamColor(
		activeTurnTeam as TeamState & { color?: string },
		0,
	);
	const explainerPlayer = game.players.find(
		(p) => p.id === game.currentRound?.explainerId,
	) ?? game.players[0];

	if (explainerPlayer) {
		activeSpeakers.push({
			id: explainerPlayer.id,
			name: explainerPlayer.name.replace(/ \(.*\)/, ""),
			teamName: activeTurnTeam?.name ?? "Team Red",
			teamColor: activeTurnTeamColor,
		});
	}

	// Speaker 2: Opponent talking (e.g. Oleg from Team 2)
	const secondTeam = game.teams[1];
	if (secondTeam && secondTeam.playerIds && secondTeam.playerIds.length > 0) {
		const secondPlayer = game.players.find((p) => p.id === secondTeam.playerIds?.[0]);
		if (secondPlayer) {
			const secondTeamColor = getDynamicTeamColor(
				secondTeam as TeamState & { color?: string },
				1,
			);
			activeSpeakers.push({
				id: secondPlayer.id,
				name: secondPlayer.name.replace(/ \(.*\)/, ""),
				teamName: secondTeam.name,
				teamColor: secondTeamColor,
			});
		}
	}

	return (
		<footer className={styles.footer}>
			{/* Left: Discord-style controls */}
			<div className={styles.controlsSection}>
				<button
					type="button"
					className={`${styles.discordBtn} ${isMuted ? styles.muted : styles.active}`}
					onClick={handleMicToggle}
					title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
				>
					{isMuted ? <MicOff size={18} /> : <Mic size={18} />}
				</button>

				<button
					type="button"
					className={`${styles.discordBtn} ${isDeafened ? styles.muted : ""}`}
					onClick={handleDeafenToggle}
					title={isDeafened ? "Undeafen Audio" : "Deafen Audio"}
				>
					{isDeafened ? <VolumeX size={18} /> : <Headphones size={18} />}
				</button>

				<button
					type="button"
					className={styles.discordBtn}
					onClick={() => setShowSettingsNotice(!showSettingsNotice)}
					title="Voice & Audio Settings"
				>
					<Settings size={18} />
				</button>
			</div>

			{/* Center: Active speakers indicator widget */}
			<div className={styles.speakersSection}>
				<div className={styles.speakerBox}>
					<div className={styles.speakingWave}>
						<span className={styles.waveStick} />
						<span className={styles.waveStick} />
						<span className={styles.waveStick} />
					</div>

					<span>Speaking now:</span>

					<div className={styles.speakerChips}>
						{activeSpeakers.map((speaker) => (
							<span
								key={speaker.id}
								className={styles.speakerChip}
								style={
									{
										"--speaker-team-color": speaker.teamColor,
									} as React.CSSProperties
								}
							>
								{speaker.name} ({speaker.teamName})
							</span>
						))}
					</div>
				</div>
			</div>

			{/* Right: Connection status & ping */}
			<div className={styles.statusSection}>
				<div className={styles.statusBadge}>
					<span className={styles.pulseDot} />
					<Radio size={14} />
					<span>
						{pingMs}ms • {isConnected ? "Voice Connected" : "Connecting..."}
					</span>
				</div>
			</div>
		</footer>
	);
}
