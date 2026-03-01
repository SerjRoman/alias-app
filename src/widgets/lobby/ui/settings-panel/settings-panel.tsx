import type { GameStateDetails, GameWordsLevel } from "@entities/game/model";
import { socketClient } from "@shared/api/socket";
import { Check, Copy, Settings } from "lucide-react";
import styles from "./settings-panel.module.css";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export function SettingsPanel({
	game,
	isOwner,
}: Readonly<{ game: GameStateDetails; isOwner: boolean }>) {
	const [searchParams] = useSearchParams();
	const [points, setPoints] = useState(game.settings.pointsToWin);
	const [time, setTime] = useState(game.settings.roundTimeSeconds);
	const [level, setLevel] = useState<GameWordsLevel>(game.settings.level);
	const [isCopied, setIsCopied] = useState(false);
	const code = searchParams.get("code");

	useEffect(() => {
		setPoints(game.settings.pointsToWin);
		setTime(game.settings.roundTimeSeconds);
		setLevel(game.settings.level);
	}, [game.settings]);

	const handleSave = () => {
		socketClient.emit("updateGameSettings", {
			roomId: game.id,
			pointsToWin: points,
			roundTimeSeconds: time,
			level,
		});
	};
	const handleCopyLink = async () => {
		let inviteLink = `${globalThis.location.origin}/game?id=${game.id}`;

		if (game.settings.isPrivate && code) {
			inviteLink += `&code=${code}`;
		}

		try {
			await navigator.clipboard.writeText(inviteLink);
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy link: ", err);
		}
	};

	const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newLevel = e.target.value as GameWordsLevel;
		setLevel(newLevel);

		socketClient.emit("updateGameSettings", {
			roomId: game.id,
			pointsToWin: points,
			roundTimeSeconds: time,
			level: newLevel,
		});
	};

	return (
		<div className={styles.panel}>
			<div className={styles.header}>
				<h3 className={styles.title}>
					<Settings size={18} /> Game Settings
				</h3>
				<button
					className={`${styles.copyButton} ${isCopied ? styles.copied : ""}`}
					onClick={handleCopyLink}
					title="Copy invite link"
				>
					{isCopied ? <Check size={14} /> : <Copy size={14} />}
					{isCopied ? "Copied!" : "Copy Link"}
				</button>
			</div>

			<div className={styles.formGroup}>
				<label className={styles.label}>
					<span>Round Time (sec):</span>
					<input
						className={styles.inputField}
						type="number"
						value={time}
						onChange={(e) => setTime(Number(e.target.value))}
						onBlur={handleSave}
						disabled={!isOwner}
					/>
				</label>

				<label className={styles.label}>
					<span>Points to Win:</span>
					<input
						className={styles.inputField}
						type="number"
						value={points}
						onChange={(e) => setPoints(Number(e.target.value))}
						onBlur={handleSave}
						disabled={!isOwner}
					/>
				</label>

				<label className={styles.label}>
					<span>Words Difficulty:</span>
					<select
						className={styles.inputField}
						value={level}
						onChange={handleLevelChange}
						disabled={!isOwner}
					>
						{["easy", "medium", "hard"].map((lvl) => (
							<option key={lvl} value={lvl}>
								{lvl.charAt(0).toUpperCase() + lvl.slice(1)}
							</option>
						))}
					</select>
				</label>
			</div>
		</div>
	);
}
