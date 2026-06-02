import styles from "./create-game.module.css";
import { useNavigate } from "react-router-dom";
import { useMutation, translateApiError } from "@shared/api";
import { useAuth } from "@entities/auth";
import { Button, Input } from "@shared/ui";
import { Select } from "@shared/ui/select";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const createGameSchema = z.object({
	name: z
		.string()
		.min(2, "Game name must be at least 2 characters")
		.max(50, "Game name must be at most 50 characters"),
	roundTimeSeconds: z
		.number()
		.int()
		.min(10, "Time limit must be at least 10 seconds")
		.max(300, "Time limit must be at most 300 seconds"),
	pointsToWin: z
		.number()
		.int()
		.min(5, "Points to win must be at least 5")
		.max(1000, "Points to win must be at most 1000"),
	isPrivate: z.enum(["true", "false"]),
	level: z.enum(["easy", "medium", "hard"]),
	language: z.enum(["ru", "en"]),
});

type CreateGameValues = z.infer<typeof createGameSchema>;

export function CreateGameForm() {
	const {
		mutate: createGame,
		isPending,
		error,
		isError,
	} = useMutation("post", "/games");
	const { token } = useAuth();
	const navigate = useNavigate();
	const { t } = useTranslation();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<CreateGameValues>({
		resolver: zodResolver(createGameSchema),
		defaultValues: {
			name: "",
			roundTimeSeconds: 60,
			pointsToWin: 30,
			isPrivate: "false",
			level: "easy",
			language: "ru",
		},
	});

	const onSubmit = (data: CreateGameValues) => {
		console.log(data);
		createGame(
			{
				body: {
					name: data.name.trim(),
					roundTimeSeconds: data.roundTimeSeconds,
					isPrivate: data.isPrivate === "true",
					pointsToWin: data.pointsToWin,
					level: data.level,
					language: data.language,
					isOnlyOwnerCanNextRound: true,
					isOnlyOwnerCanChangeScore: true,
				},
				headers: { Authorization: `Bearer ${token}` },
			},
			{
				onSuccess: (responseData) => {
					const codeParam: string =
						responseData.code && responseData.code.length >= 1
							? `&code=${responseData.code}`
							: "";
					navigate(`/game?id=${responseData.id}${codeParam}`);
				},
			},
		);
	};

	return (
		<form className={styles.formCard} onSubmit={handleSubmit(onSubmit)}>
			<h3 className={styles.title}>{t("games.create")}</h3>
			<div className={styles.row}>
				<Input
					type="text"
					label={`${t("games.name")}:`}
					placeholder={t("games.namePlaceholder")}
					error={errors.name?.message}
					{...register("name")}
				/>

				<Input
					type="number"
					label={`${t("games.timeLimit")}:`}
					placeholder={t("games.timeLimitPlaceholder")}
					error={errors.roundTimeSeconds?.message}
					{...register("roundTimeSeconds", { valueAsNumber: true })}
				/>

				<Input
					type="number"
					label={`${t("games.pointsToWin")}:`}
					placeholder={t("games.pointsToWinPlaceholder")}
					error={errors.pointsToWin?.message}
					{...register("pointsToWin", { valueAsNumber: true })}
				/>

				<div className={styles.privateBlock}>
					<span className={styles.labelTitle}>
						{t("games.private")}
					</span>

					<label className={styles.radioLabel}>
						<input
							className={styles.radioInput}
							type="radio"
							value="true"
							{...register("isPrivate")}
						/>{" "}
						{t("common.yes")}
					</label>

					<label className={styles.radioLabel}>
						<input
							className={styles.radioInput}
							type="radio"
							value="false"
							{...register("isPrivate")}
						/>{" "}
						{t("common.no")}
					</label>
				</div>

				<label className={styles.selectLevelLabel}>
					{t("games.level")}:{" "}
					<Select
						className={styles.selectLevel}
						{...register("level")}
					>
						{["easy", "medium", "hard"].map((lvl) => (
							<option key={lvl} value={lvl}>
								{lvl.charAt(0).toUpperCase() + lvl.slice(1)}
							</option>
						))}
					</Select>
				</label>

				<label className={styles.selectLevelLabel}>
					{t("games.language")}:{" "}
					<Select
						className={styles.selectLevel}
						{...register("language")}
					>
						<option value="ru">Русский (RU)</option>
						<option value="en">English (EN)</option>
					</Select>
				</label>
			</div>

			<Button
				className={styles.button}
				type="submit"
				disabled={isPending}
			>
				{isPending ? t("common.creating") : t("games.createGame")}
			</Button>

			{isError && (
				<div className={styles.serverError}>
					{translateApiError(t, error)}
				</div>
			)}
		</form>
	);
}
