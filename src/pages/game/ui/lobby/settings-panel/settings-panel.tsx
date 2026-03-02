import { Check, Copy, Settings } from "lucide-react";
import styles from "./settings-panel.module.css";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { GameStateDetails, GameWordsLevel } from "@entities/game";
import { socketClient } from "@shared/api";

export function SettingsPanel({
	game,
	isOwner,
}: Readonly<{ game: GameStateDetails; isOwner: boolean }>) {
	const [searchParams] = useSearchParams();
	const isCopiedTimeoutRef = useRef<number | null>(null);

	const pointsInputRef = useRef<HTMLInputElement | null>(null);
	const timeInputRef = useRef<HTMLInputElement | null>(null);
	const levelSelectRef = useRef<HTMLSelectElement | null>(null);

	const [isCopied, setIsCopied] = useState(false);
	const code = searchParams.get("code");

	useEffect(() => {
		if (pointsInputRef.current) {
			pointsInputRef.current.value = String(game.settings.pointsToWin);
		}
		if (timeInputRef.current) {
			timeInputRef.current.value = String(game.settings.roundTimeSeconds);
		}
		if (levelSelectRef.current) {
			levelSelectRef.current.value = game.settings.level;
		}
	}, [game.settings]);

	useEffect(() => {
		return () => {
			if (isCopiedTimeoutRef.current) {
				globalThis.clearTimeout(isCopiedTimeoutRef.current);
			}
		};
	}, []);

	const emitCurrentSettings = (overrideLevel?: GameWordsLevel) => {
		const points = Number(
			pointsInputRef.current?.value ?? game.settings.pointsToWin,
		);
		const time = Number(
			timeInputRef.current?.value ?? game.settings.roundTimeSeconds,
		);
		const level =
			overrideLevel ??
			(levelSelectRef.current?.value as GameWordsLevel) ??
			game.settings.level;

		socketClient.emit("updateGameSettings", {
			roomId: game.id,
			pointsToWin: points,
			roundTimeSeconds: time,
			level,
		});
	};

	const handleSaveBlur = () => emitCurrentSettings();

	const handleCopyLink = async () => {
		let inviteLink = `${globalThis.location.origin}/game?id=${game.id}`;

		if (game.settings.isPrivate && code) {
			inviteLink += `&code=${code}`;
		}

		try {
			await navigator.clipboard.writeText(inviteLink);
			setIsCopied(true);
			isCopiedTimeoutRef.current = globalThis.setTimeout(
				() => setIsCopied(false),
				2000,
			);
		} catch (err) {
			console.error("Failed to copy link: ", err);
		}
	};

	const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newLevel = e.target.value as GameWordsLevel;
		emitCurrentSettings(newLevel);
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
						ref={timeInputRef}
						className={styles.inputField}
						type="number"
						defaultValue={game.settings.roundTimeSeconds}
						onBlur={handleSaveBlur}
						disabled={!isOwner}
					/>
				</label>

				<label className={styles.label}>
					<span>Points to Win:</span>
					<input
						ref={pointsInputRef}
						className={styles.inputField}
						type="number"
						defaultValue={game.settings.pointsToWin}
						onBlur={handleSaveBlur}
						disabled={!isOwner}
					/>
				</label>

				<label className={styles.label}>
					<span>Words Difficulty:</span>
					<select
						ref={levelSelectRef}
						className={styles.inputField}
						defaultValue={game.settings.level}
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
