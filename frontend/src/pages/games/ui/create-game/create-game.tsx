import { useState } from "react";
import styles from "./create-game.module.css";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@shared/api";
import { useAuth } from "@entities/auth";
import type { GameWordsLevel } from "@entities/game";
import { Button } from "@shared/ui/button";
import { Select } from "@shared/ui/select";
import { useTranslation } from "react-i18next";

export function CreateGameForm() {
	const { mutate: createGame, isPending } = useMutation("post", "/games");
	const { token } = useAuth();
	const navigate = useNavigate();
	const [gameName, setGameName] = useState<string>("");
	const [gameTimeLimit, setGameTimeLimit] = useState<number>(60);
	const [pointsToWin, setPointsToWin] = useState<number>(30);
	const [isPrivate, setIsPrivate] = useState<boolean>(false);
	const [level, setLevel] = useState<string>("easy");
	const { t } = useTranslation();
	return (
		<div className={styles.formCard}>
			<h3 className={styles.title}>{t("games.create")}</h3>
			<div className={styles.row}>
				<label className={styles.label}>
					{t("games.name")}:{" "}
					<input
						className={styles.input}
						type="text"
						value={gameName}
						onChange={(event) => setGameName(event.target.value)}
						placeholder={t("games.namePlaceholder")}
					/>
				</label>
				<label className={styles.label}>
					{t("games.timeLimit")}:{" "}
					<input
						className={styles.input}
						type="number"
						value={gameTimeLimit}
						onChange={(event) =>
							setGameTimeLimit(Number(event.target.value))
						}
						placeholder={t("games.timeLimitPlaceholder")}
					/>
				</label>
				<label className={styles.label}>
					{t("games.pointsToWin")}:{" "}
					<input
						className={styles.input}
						type="number"
						value={pointsToWin}
						onChange={(event) =>
							setPointsToWin(Number(event.target.value))
						}
						placeholder={t("games.pointsToWinPlaceholder")}
					/>
				</label>

				<div className={styles.privateBlock}>
					<span className={styles.labelTitle}>
						{t("games.private")}
					</span>

					<label className={styles.radioLabel}>
						<input
							className={styles.radioInput}
							type="radio"
							name="isPrivate"
							checked={isPrivate === true}
							onChange={() => setIsPrivate(true)}
						/>{" "}
						{t("common.yes")}
					</label>

					<label className={styles.radioLabel}>
						<input
							className={styles.radioInput}
							type="radio"
							name="isPrivate"
							checked={isPrivate === false}
							onChange={() => setIsPrivate(false)}
						/>{" "}
						{t("common.no")}
					</label>
				</div>
				<label className={styles.selectLevelLabel}>
                    {t("games.level")}:{" "}
					<Select
						value={level}
						onChange={(event) => setLevel(event.target.value)}
                        className={styles.selectLevel}
					>
						{["easy", "medium", "hard"].map((lvl) => (
							<option key={lvl} value={lvl}>
								{lvl.charAt(0).toUpperCase() + lvl.slice(1)}
							</option>
						))}
					</Select>
				</label>
			</div>
			<Button
				className={styles.button}
				disabled={isPending}
				onClick={() => {
					createGame(
						{
							body: {
								name: gameName,
								roundTimeSeconds: gameTimeLimit,
								isPrivate: isPrivate,
								pointsToWin: pointsToWin,
								level: level as GameWordsLevel,
								isOnlyOwnerCanNextRound: true,
								isOnlyOwnerCanChangeScore: true,
							},
							headers: { Authorization: `Bearer ${token}` },
						},
						{
							onSuccess: (data) => {
								const c: string | null =
									data.code?.length >= 1
										? `&code=${data.code}`
										: "";
								navigate(`/game?id=${data.id}${c}`);
							},
						},
					);
				}}
			>
				{isPending ? t("common.creating") : t("games.createGame")}
			</Button>
		</div>
	);
}
