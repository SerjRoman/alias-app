import styles from "./create-game.module.css";
import { useNavigate } from "react-router-dom";
import { useMutation, translateApiError } from "@shared/api";
import { useAuth } from "@entities/auth";
import { Button, Input } from "@shared/ui";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useModal } from "@shared/lib/hooks";
import { WordPacksModal } from "@entities/game";

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
	isHatMode: z.boolean(),
	wordsPerPlayer: z
		.number()
		.int()
		.min(0, "Custom words count cannot be negative")
		.max(50, "Players cannot submit more than 50 words each"),
	wordPackSelections: z
		.array(
			z.object({
				packId: z.uuid(),
				count: z.number().int().positive(),
			}),
		)
		.optional(),
}).refine(data => {
	if (data.isHatMode && data.wordsPerPlayer <= 0) {
		return false;
	}
	return true;
}, {
	message: "Words per player must be greater than 0 when Hat Mode is enabled",
	path: ["wordsPerPlayer"]
});

type CreateGameValues = z.infer<typeof createGameSchema>;

interface WordPacksModalProps {
	selectedPacks: { packId: string; count: number }[];
	onSave: (selections: { packId: string; count: number }[]) => void;
}

export function CreateGameForm({
	showAssistant,
}: Readonly<{
	showAssistant?: (msg: string | null) => void;
}>) {
	const {
		mutate: createGame,
		isPending,
		error,
		isError,
	} = useMutation("post", "/games");
	const { token } = useAuth();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [{ open }, WordPackModal] = useModal<WordPacksModalProps>();

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
		watch,
	} = useForm<CreateGameValues>({
		resolver: zodResolver(createGameSchema),
		defaultValues: {
			name: "",
			roundTimeSeconds: 60,
			pointsToWin: 30,
			isPrivate: "false",
			isHatMode: false,
			wordsPerPlayer: 0,
			wordPackSelections: [],
		},
	});

	const wordPackSelections = watch("wordPackSelections") || [];

	const onSubmit = (data: CreateGameValues) => {
		createGame(
			{
				body: {
					name: data.name.trim(),
					roundTimeSeconds: data.roundTimeSeconds,
					isPrivate: data.isPrivate === "true",
					pointsToWin: data.pointsToWin,
					isHatMode: data.isHatMode,
					wordsPerPlayer: data.isHatMode ? (data.wordsPerPlayer || 0) : 0,
					wordPackSelections: data.wordPackSelections || [],
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

	const totalWordsInPacks = wordPackSelections.reduce(
		(sum, item) => sum + item.count,
		0,
	);

	return (
		<form className={styles.formCard} onSubmit={handleSubmit(onSubmit)}>
			<h3 className={styles.title}>{t("games.create")}</h3>
			<div className={styles.row}>
				<Input
					type="text"
					label={`${t("games.name")}:`}
					placeholder={t("games.namePlaceholder")}
					error={errors.name?.message}
					{...register("name", {
						onBlur: () => showAssistant?.(null),
					})}
					onFocus={() =>
						showAssistant?.(t("games.assistant.createFormFocus"))
					}
				/>

				<Input
					type="number"
					label={`${t("games.timeLimit")}:`}
					placeholder={t("games.timeLimitPlaceholder")}
					error={errors.roundTimeSeconds?.message}
					{...register("roundTimeSeconds", {
						valueAsNumber: true,
						onBlur: () => showAssistant?.(null),
					})}
					onFocus={() =>
						showAssistant?.(t("games.assistant.createFormFocus"))
					}
				/>

				<Input
					type="number"
					label={`${t("games.pointsToWin")}:`}
					placeholder={t("games.pointsToWinPlaceholder")}
					error={errors.pointsToWin?.message}
					{...register("pointsToWin", {
						valueAsNumber: true,
						onBlur: () => showAssistant?.(null),
					})}
					onFocus={() =>
						showAssistant?.(t("games.assistant.createFormFocus"))
					}
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

				<div className={styles.privateBlock}>
					<span className={styles.labelTitle}>
						{t("games.modeCustom")}:
					</span>
					<label className={styles.radioLabel}>
						<input
							className={styles.radioInput}
							type="checkbox"
							{...register("isHatMode")}
						/>{" "}
						{t("games.enableHatMode") || "Включить"}
					</label>
				</div>

				{watch("isHatMode") && (
					<Input
						type="number"
						label={`${t("games.wordsPerPlayer")}:`}
						error={errors.wordsPerPlayer?.message}
						{...register("wordsPerPlayer", {
							valueAsNumber: true,
							onBlur: () => showAssistant?.(null),
						})}
						onFocus={() =>
							showAssistant?.(t("games.assistant.createFormFocus"))
						}
					/>
				)}

				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "6px",
					}}
				>
					<Button
						type="button"
						onClick={() =>
							open({
								selectedPacks: wordPackSelections,
								onSave: (selections) =>
									setValue(
										"wordPackSelections",
										selections,
									),
							})
						}
					>
						{t("games.wordPacks")}
					</Button>
					{wordPackSelections.length > 0 ? (
						<span
							style={{
								fontSize: "0.85rem",
								color: "#a0a0b0",
								textAlign: "center",
							}}
						>
							{t("games.selectedPacksCount")}:{" "}
							{wordPackSelections.length} (
							{t("games.totalWordsCount")}:{" "}
							{totalWordsInPacks})
						</span>
					) : (
						<span
							style={{
								fontSize: "0.85rem",
								color: "#ef4444",
								textAlign: "center",
							}}
						>
							{t("games.noPacksSelected")}
						</span>
					)}
				</div>
			</div>

			<Button
				className={styles.button}
				type="submit"
				disabled={
					isPending ||
					(!watch("isHatMode") && wordPackSelections.length === 0)
				}
			>
				{isPending ? t("common.creating") : t("games.createGame")}
			</Button>
			{isError && (
				<div className={styles.serverError}>
					{translateApiError(t, error)}
				</div>
			)}
			<WordPackModal ModalComponent={WordPacksModal}></WordPackModal>
		</form>
	);
}
