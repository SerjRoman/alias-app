import { Check, Copy, Settings } from "lucide-react";
import styles from "./settings-panel.module.css";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { type GameStateDetails, type GameWordsLevel, WordPacksModal } from "@entities/game";
import { socketClient } from "@shared/api";
import { Button, Tooltip } from "@shared/ui";
import { Select } from "@shared/ui/select";
import { useTranslation } from "react-i18next";
import { useModal } from "@shared/lib/hooks";

interface WordPacksModalProps {
	selectedPacks: { packId: string; count: number }[];
	onSave: (selections: { packId: string; count: number }[]) => void;
}

const LEVELS = ["easy", "medium", "hard"] as const;

export function SettingsPanel({
	game,
	isOwner,
}: Readonly<{ game: GameStateDetails; isOwner: boolean }>) {
	const { t } = useTranslation();
	const [searchParams] = useSearchParams();
	const isCopiedTimeoutRef = useRef<number | null>(null);

	const pointsInputRef = useRef<HTMLInputElement | null>(null);
	const timeInputRef = useRef<HTMLInputElement | null>(null);
	const levelSelectRef = useRef<HTMLSelectElement | null>(null);
	const voiceChatCheckboxRef = useRef<HTMLInputElement | null>(null);
	const languageSelectRef = useRef<HTMLSelectElement | null>(null);
	const wordsPerPlayerInputRef = useRef<HTMLInputElement | null>(null);

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
		if (levelSelectRef.current) {
			levelSelectRef.current.value = game.settings.level ?? "easy";
		}
		if (voiceChatCheckboxRef.current) {
			voiceChatCheckboxRef.current.checked =
				game.settings.isVoiceChatEnabled ?? true;
		}
		if (languageSelectRef.current) {
			languageSelectRef.current.value = game.settings.language ?? "ru";
		}
		if (wordsPerPlayerInputRef.current) {
			wordsPerPlayerInputRef.current.value = String(game.settings.wordsPerPlayer ?? 0);
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
		overrideLevel?: GameWordsLevel,
		overrideVoiceChat?: boolean,
		overrideLanguage?: "ru" | "en",
		overrideWordPackSelections?: { packId: string; count: number }[],
	) => {
		const points = Number(
			pointsInputRef.current?.value ?? game.settings.pointsToWin,
		);
		const time = Number(
			timeInputRef.current?.value ?? game.settings.roundTimeSeconds,
		);
		const level =
			overrideLevel ??
			(levelSelectRef.current?.value as GameWordsLevel) ??
			game.settings.level ??
			"easy";
		const isVoiceChatEnabled =
			overrideVoiceChat ??
			voiceChatCheckboxRef.current?.checked ??
			game.settings.isVoiceChatEnabled ??
			true;
		const language =
			overrideLanguage ??
			(languageSelectRef.current?.value as "ru" | "en") ??
			game.settings.language ??
			"ru";
		const selections = overrideWordPackSelections ?? wordPackSelections;
		const perPlayer = Number(
			wordsPerPlayerInputRef.current?.value ?? game.settings.wordsPerPlayer ?? 0,
		);

		socketClient.emit("updateGameSettings", {
			roomId: game.id,
			pointsToWin: points,
			roundTimeSeconds: time,
			level,
			isVoiceChatEnabled,
			language,
			wordPackSelections: selections,
			wordsPerPlayer: perPlayer,
		});
	};

	const handleSaveBlur = () => emitCurrentSettings();

	const handleSavePacks = (selections: { packId: string; count: number }[]) => {
		setWordPackSelections(selections);
		emitCurrentSettings(undefined, undefined, undefined, selections);
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

	const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newLevel = e.target.value as GameWordsLevel;
		emitCurrentSettings(newLevel);
	};

	const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newLang = e.target.value as "ru" | "en";
		emitCurrentSettings(undefined, undefined, newLang);
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

				<label className={styles.label}>
					<span>{t("gameSettings.wordsDifficulty")}</span>
					<Select
						ref={levelSelectRef}
						className={styles.inputField}
						defaultValue={game.settings.level}
						onChange={handleLevelChange}
						disabled={!isOwner}
					>
						{LEVELS.map((lvl) => (
							<option key={lvl} value={lvl}>
								{t(`gameSettings.difficulty.${lvl}`)}
							</option>
						))}
					</Select>
				</label>

				<label className={styles.label}>
					<span>{t("gameSettings.wordsLanguage")}</span>
					<Select
						ref={languageSelectRef}
						defaultValue={game.settings.language ?? "ru"}
						onChange={handleLanguageChange}
						disabled={!isOwner}
					>
						<option value="ru">{t("games.languageRu")} (RU)</option>
						<option value="en">{t("games.languageEn")} (EN)</option>
					</Select>
				</label>

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
							emitCurrentSettings(undefined, e.target.checked)
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
