import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { socketClient } from "@shared/api";
import { Button, Input } from "@shared/ui";
import styles from "./custom-words-form.module.css";

interface CustomWordsFormProps {
	roomId: string;
	wordsCount: number;
	submittedWordsCount: number;
}

interface FormValues {
	words: string[];
}

export function CustomWordsForm({
	roomId,
	wordsCount,
	submittedWordsCount,
}: Readonly<CustomWordsFormProps>) {
	const { t } = useTranslation();
	const [isEditing, setIsEditing] = useState(false);

	const isSubmitted = submittedWordsCount === wordsCount && !isEditing;

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isValid },
	} = useForm<FormValues>({
		mode: "onChange",
		defaultValues: {
			words: new Array(wordsCount).fill(""),
		},
	});

	useEffect(() => {
		reset({
			words: new Array(wordsCount).fill(""),
		});
	}, [wordsCount, reset]);

	const onSubmit = (data: FormValues) => {
		const trimmedWords = data.words.map((w) => w.trim());
		socketClient.emit("submitCustomWords", {
			roomId,
			words: trimmedWords,
		});
		setIsEditing(false);
	};

	if (isSubmitted) {
		return (
			<div className={styles.container}>
				<p className={styles.successText}>
					🎉 {t("games.wordsSubmittedSuccess")} ({submittedWordsCount}{" "}
					{t("games.totalWordsCount")})
				</p>
				<Button size="small" onClick={() => setIsEditing(true)}>
					{t("common.edit")}
				</Button>
			</div>
		);
	}

	return (
		<form className={styles.container} onSubmit={handleSubmit(onSubmit)}>
			<h4 className={styles.title}>
				{t("games.submitCustomWordsTitle")}
			</h4>
			<p className={styles.subtitle}>
				{t("games.submitCustomWordsSubtitle", { count: wordsCount })}
			</p>
			<div className={styles.inputsGrid}>
				{Array.from({ length: wordsCount }).map((_, index) => (
					<Input
						key={index}
						type="text"
						className={styles.inputField}
						placeholder={`${t("games.word")} ${index + 1}`}
						error={errors.words?.[index]?.message}
						{...register(`words.${index}` as const, {
							required:
								t("validation.required") || "Обязательное поле",
							validate: (val) =>
								val.trim().length > 0 ||
								t("validation.emptySpaces") ||
								"Слово не должно быть пустым",
						})}
					/>
				))}
			</div>
			<div className={styles.actions}>
				<Button
					type="submit"
					size="small"
					className={styles.submitBtn}
					disabled={!isValid}
				>
					{t("common.submit")}
				</Button>
				{submittedWordsCount === wordsCount && (
					<Button
						type="button"
						size="small"
						variant="secondary"
						onClick={() => {
							setIsEditing(false);
							reset();
						}}
					>
						{t("common.cancel")}
					</Button>
				)}
			</div>
		</form>
	);
}
