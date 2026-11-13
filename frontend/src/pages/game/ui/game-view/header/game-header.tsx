import { useState } from "react";
import {
	LogOut,
	Coins,
	Zap,
	ShieldAlert,
	Mic,
	MicOff,
	Headphones,
	VolumeX,
	Settings,
	Radio,
} from "lucide-react";
import type { GameStateDetails } from "@entities/game";
import styles from "./game-header.module.css";

interface GameHeaderProps {
	game: GameStateDetails;
	currentUserName?: string;
	currentUserAvatar?: string;
	walletBalance: number;
	viewMode: "explainer" | "opponent";
	pingMs?: number;
	isVoiceConnected?: boolean;
	onToggleViewMode: (mode: "explainer" | "opponent") => void;
	onLeave: () => void;
	onToggleMic?: (isMuted: boolean) => void;
	onToggleDeafen?: (isDeafened: boolean) => void;
}

export function GameHeader({
	game,
	currentUserName = "CyberFox",
	currentUserAvatar = "https://api.dicebear.com/7.x/bottts/svg?seed=CyberFox",
	walletBalance,
	viewMode,
	pingMs = 24,
	isVoiceConnected = true,
	onToggleViewMode,
	onLeave,
	onToggleMic,
	onToggleDeafen,
}: Readonly<GameHeaderProps>) {
	const currentRoundNumber = game.currentRound?.roundNumber ?? 4;

	// Voice control state in header
	const [isMuted, setIsMuted] = useState(false);
	const [isDeafened, setIsDeafened] = useState(false);

	const handleMicToggle = () => {
		const next = !isMuted;
		setIsMuted(next);
		onToggleMic?.(next);
	};

	const handleDeafenToggle = () => {
		const next = !isDeafened;
		setIsDeafened(next);
		onToggleDeafen?.(next);
	};

	return (
		<header className={styles.header}>
			{/* Left section: Leave button, Game Title, and Round badge */}
			<div className={styles.leftSection}>
				<button
					type="button"
					className={styles.leaveBtn}
					onClick={onLeave}
					title="Leave room and return to lobby"
				>
					<LogOut size={16} />
					<span>Leave</span>
				</button>

				<div className={styles.gameTitleBadge} title={game.settings.name || "Alias Game"}>
					<span className={styles.gameTitleText}>
						{game.settings.name || "Alias Game"}
					</span>
				</div>

				<div className={styles.roundBadge}>
					<span className={styles.roundDot} />
					<span>Round {currentRoundNumber}</span>
				</div>
			</div>

			{/* Center spacer: Race Track completely removed */}
			<div style={{ flex: 1 }} />

			{/* Right section: Voice controls, Wallet, Profile, View Switcher */}
			<div className={styles.rightSection}>
				{/* Transferred Voice Controls */}
				<div className={styles.voiceControlsGroup}>
					<button
						type="button"
						className={`${styles.voiceBtn} ${isMuted ? styles.muted : styles.active}`}
						onClick={handleMicToggle}
						title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
					>
						{isMuted ? <MicOff size={16} /> : <Mic size={16} />}
					</button>

					<button
						type="button"
						className={`${styles.voiceBtn} ${isDeafened ? styles.muted : ""}`}
						onClick={handleDeafenToggle}
						title={isDeafened ? "Undeafen Audio" : "Deafen Audio"}
					>
						{isDeafened ? <VolumeX size={16} /> : <Headphones size={16} />}
					</button>

					<button
						type="button"
						className={styles.voiceBtn}
						title="Voice & Audio Settings"
					>
						<Settings size={16} />
					</button>

					<div className={styles.voiceStatusBadge} title="Voice Chat Status">
						<span className={styles.pulseDot} />
						<Radio size={12} />
						<span>
							{pingMs}ms • {isVoiceConnected ? "Voice Connected" : "Connecting..."}
						</span>
					</div>
				</div>

				{/* Wallet Badge */}
				<div className={styles.walletBadge} title="Player Wallet">
					<Coins size={14} />
					<span>{walletBalance}</span>
				</div>

				{/* User Profile */}
				<div className={styles.userProfile} title={`Signed in as ${currentUserName}`}>
					<div className={styles.avatarWrapper}>
						<img
							src={currentUserAvatar}
							alt={currentUserName}
							className={styles.avatar}
						/>
						<span className={styles.onlineDot} />
					</div>
					<span className={styles.userName}>{currentUserName}</span>
				</div>

				{/* Interactive View Switcher */}
				<div className={styles.viewModeToggle} title="Switch demo view perspective">
					<button
						type="button"
						className={`${styles.viewModeBtn} ${
							viewMode === "explainer" ? styles.active : ""
						}`}
						onClick={() => onToggleViewMode("explainer")}
					>
						<Zap size={13} />
						<span>Explainer</span>
					</button>
					<button
						type="button"
						className={`${styles.viewModeBtn} ${
							viewMode === "opponent" ? styles.active : ""
						}`}
						onClick={() => onToggleViewMode("opponent")}
					>
						<ShieldAlert size={13} />
						<span>Opponent</span>
					</button>
				</div>
			</div>
		</header>
	);
}
