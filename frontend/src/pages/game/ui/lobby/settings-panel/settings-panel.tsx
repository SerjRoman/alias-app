import { Check, Copy, Settings } from "lucide-react";
import styles from "./settings-panel.module.css";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { type GameStateDetails, WordPacksModal } from "@entities/game";
import { socketClient } from "@shared/api";
import { Button, Tooltip } from "@shared/ui";
import { useTranslation } from "react-i18next";
import { useModal } from "@shared/lib/hooks";

interface WordPacksModalProps {
	selectedPacks: { packId: string; count: number }[];
	onSave: (selections: { packId: string; count: number }[]) => void;
}

export function SettingsPanel({
	game,
	isOwner,
}: Readonly<{ game: GameStateDetails; isOwner: boolean }>) {
	const { t } = useTranslation();
	const [searchParams] = useSearchParams();
	const isCopiedTimeoutRef = useRef<number | null>(null);

	const pointsInputRef = useRef<HTMLInputElement | null>(null);
	const timeInputRef = useRef<HTMLInputElement | null>(null);
	const voiceChatCheckboxRef = useRef<HTMLInputElement | null>(null);
	const wordsPerPlayerInputRef = useRef<HTMLInputElement | null>(null);
	const hatModeCheckboxRef = useRef<HTMLInputElement | null>(null);

	const [isCopied, setIsCopied] = useState(false);
	const [wordPackSelections, setWordPackSelections] = useState<{ packId: string; count: number }[]>([]);
	const [{ open }, WordPackModal] = useModal<WordPacksModalProps>();
	const code = searchParams.get("code");

	useEffect(() => {
		if (pointsInputRef.current) {
			pointsInputRef.current.value = String(game.settings.pointsToWin);
		}
		if (timeInputRef.current) {
			timeInputRef.current.value = String(game.settings.roundTimeSeconds);
		}
		if (voiceChatCheckboxRef.current) {
			voiceChatCheckboxRef.current.checked =
				game.settings.isVoiceChatEnabled ?? true;
		}
		if (wordsPerPlayerInputRef.current) {
			wordsPerPlayerInputRef.current.value = String(game.settings.wordsPerPlayer ?? 0);
		}
		if (hatModeCheckboxRef.current) {
			hatModeCheckboxRef.current.checked =
				game.settings.isHatMode ?? false;
		}
		setWordPackSelections(game.settings.wordPackSelections ?? []);
	}, [game.settings]);

	useEffect(() => {
		return () => {
			if (isCopiedTimeoutRef.current) {
				globalThis.clearTimeout(isCopiedTimeoutRef.current);
			}
		};
	}, []);

	const emitCurrentSettings = (
		overrideVoiceChat?: boolean,
		overrideWordPackSelections?: { packId: string; count: number }[],
		overrideHatMode?: boolean,
	) => {
		const points = Number(
			pointsInputRef.current?.value ?? game.settings.pointsToWin,
		);
		const time = Number(
			timeInputRef.current?.value ?? game.settings.roundTimeSeconds,
		);
		const isVoiceChatEnabled =
			overrideVoiceChat ??
			voiceChatCheckboxRef.current?.checked ??
			game.settings.isVoiceChatEnabled ??
			true;
		const selections = overrideWordPackSelections ?? wordPackSelections;
		const isHatMode =
			overrideHatMode ??
			hatModeCheckboxRef.current?.checked ??
			game.settings.isHatMode ??
			false;
		const perPlayer = isHatMode
			? Number(
					wordsPerPlayerInputRef.current?.value ??
						game.settings.wordsPerPlayer ??
						0,
			  )
			: 0;

		socketClient.emit("updateGameSettings", {
			roomId: game.id,
			pointsToWin: points,
			roundTimeSeconds: time,
			isVoiceChatEnabled,
			wordPackSelections: selections,
			isHatMode,
			wordsPerPlayer: perPlayer,
		});
	};

	const handleSaveBlur = () => emitCurrentSettings();

	const handleSavePacks = (selections: { packId: string; count: number }[]) => {
		setWordPackSelections(selections);
		emitCurrentSettings(undefined, selections);
	};

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

	return (
		<div className={styles.panel}>
			<div className={styles.header}>
				<h3 className={styles.title}>
					<Settings size={18} /> {t("gameSettings.title")}
				</h3>
				<Tooltip text={t("tooltips.copyLink")}>
					<Button
						className={`${styles.copyButton} ${isCopied ? styles.copied : ""}`}
						onClick={handleCopyLink}
					>
						{isCopied ? <Check size={14} /> : <Copy size={14} />}
						{isCopied
							? t("gameSettings.copied")
							: t("gameSettings.copyLink")}
					</Button>
				</Tooltip>
			</div>

			<div className={styles.formGroup}>
				<label className={styles.label}>
					<span>{t("gameSettings.roundTime")}</span>
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
					<span>{t("gameSettings.pointsToWin")}</span>
					<input
						ref={pointsInputRef}
						className={styles.inputField}
						type="number"
						defaultValue={game.settings.pointsToWin}
						onBlur={handleSaveBlur}
						disabled={!isOwner}
					/>
				</label>



				<label className={styles.labelCheckbox}>
					<input
						ref={hatModeCheckboxRef}
						className={styles.checkboxInput}
						type="checkbox"
						defaultChecked={game.settings.isHatMode ?? false}
						onChange={(e) =>
							emitCurrentSettings(
								undefined,
								undefined,
								e.target.checked,
							)
						}
						disabled={!isOwner}
					/>
					<span>{t("games.modeCustom")}</span>
				</label>

				{(game.settings.isHatMode ?? false) && (
					<label className={styles.label}>
						<span>{t("games.wordsPerPlayer")}</span>
						<input
							ref={wordsPerPlayerInputRef}
							className={styles.inputField}
							type="number"
							defaultValue={game.settings.wordsPerPlayer ?? 0}
							onBlur={handleSaveBlur}
							disabled={!isOwner}
						/>
					</label>
				)}

				<div className={styles.packsSection}>
					{isOwner ? (
						<Button
							type="button"
							size="small"
							onClick={() =>
								open({
									selectedPacks: wordPackSelections,
									onSave: handleSavePacks,
								})
							}
						>
							{t("games.wordPacks")}
						</Button>
					) : (
						<span className={styles.packsLabelReadOnly}>
							{t("games.wordPacks")}:
						</span>
					)}

					{wordPackSelections.length > 0 ? (
						<span className={styles.packsSummaryText}>
							{t("games.selectedPacksCount")}:{" "}
							{wordPackSelections.length} (
							{t("games.totalWordsCount")}:{" "}
							{wordPackSelections.reduce((sum, item) => sum + item.count, 0)}
							)
						</span>
					) : (
						<span className={styles.noPacksWarning}>
							{t("games.noPacksSelected")}
						</span>
					)}
				</div>

				<label className={styles.labelCheckbox}>
					<input
						ref={voiceChatCheckboxRef}
						className={styles.checkboxInput}
						type="checkbox"
						defaultChecked={
							game.settings.isVoiceChatEnabled ?? true
						}
						onChange={(e) =>
							emitCurrentSettings(e.target.checked)
						}
						disabled={!isOwner}
					/>
					<span>{t("gameSettings.voiceChat")}</span>
				</label>
			</div>
			<WordPackModal ModalComponent={WordPacksModal} />
		</div>
	);
}
