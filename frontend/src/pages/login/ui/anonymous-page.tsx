import { type SubmitEvent, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./page.module.css";
import { useMutation, translateApiError, useAuth, type User } from "@shared/api";
import { Button, Input } from "@shared/ui";
import { useTranslation } from "react-i18next";

type LoginResponse = {
	accessToken: string;
	user: User;
};

function applyAuthResult(
	setAuth: (data: { token: string | null; user: User | null }) => void,
	data: LoginResponse,
) {
	setAuth({
		token: data.accessToken,
		user: data.user,
	});
}

export function AnonymousLoginPage() {
	const { setAuth } = useAuth();
	const [name, setName] = useState("");
	const { mutate, isPending, error, isError } = useMutation(
		"post",
		"/user/login/anonymous",
	);
	const { t } = useTranslation();
	const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();

		mutate(
			{
				body: { name: name.trim() },
			},
			{
				onSuccess: (data) => applyAuthResult(setAuth, data),
			},
		);
	};

	return (
		<div className={styles.loginPage}>
			<div className={styles.loginCard}>
				<div className={styles.header}>
					<p className={styles.kicker}>
						{t("anonymousLogin.access")}
					</p>
					<h1 className={styles.title}>
						{t("anonymousLogin.title")}
					</h1>
					<p className={styles.description}>
						{t("anonymousLogin.description")}
					</p>
				</div>

				<form className={styles.form} onSubmit={handleSubmit}>
					<Input
						type="text"
						label={t("anonymousLogin.guestName")}
						value={name}
						onChange={(event) => setName(event.target.value)}
						placeholder="Guest_123"
						autoComplete="off"
						required
					/>

					<Button
						className={styles.button}
						type="submit"
						disabled={isPending}
					>
						{isPending
							? t("common.loading")
							: t("anonymousLogin.continue")}
					</Button>

					{isError && (
						<div className={styles.serverError}>
							{translateApiError(t, error)}
						</div>
					)}
				</form>

				<Link className={styles.secondaryLink} to="/login">
					{t("anonymousLogin.backToAccountLogin")}
				</Link>
			</div>
		</div>
	);
}
