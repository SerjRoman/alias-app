import { type SubmitEvent, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./page.module.css";
import { useAuth, type User } from "@entities/auth";
import { useMutation } from "@shared/api";
import { Button } from "@shared/ui/button";
import { useTranslation } from "react-i18next";

type LoginResponse = {
	accessToken: string;
	user: User;
};

function applyAuthResult(
	setToken: (token: string | null) => void,
	setUser: (user: User | null) => void,
	data: LoginResponse,
) {
	setToken(data.accessToken);
	setUser(data.user);
}

export function AnonymousLoginPage() {
	const { setToken, setUser } = useAuth();
	const [name, setName] = useState("");
	const { mutate, isPending } = useMutation("post", "/user/login/anonymous");
	const { t } = useTranslation();
	const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();

		mutate(
			{
				body: { name: name.trim() },
			},
			{
				onSuccess: (data) => applyAuthResult(setToken, setUser, data),
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
					<label className={styles.field}>
						<span className={styles.label}>
							{t("anonymousLogin.guestName")}
						</span>
						<input
							className={styles.input}
							type="text"
							value={name}
							onChange={(event) => setName(event.target.value)}
							placeholder="Guest_123"
							autoComplete="off"
							required
						/>
					</label>

					<Button
						className={styles.button}
						type="submit"
						disabled={isPending}
					>
						{isPending
							? t("common.loading")
							: t("anonymousLogin.continue")}
					</Button>
				</form>

				<Link className={styles.secondaryLink} to="/login">
					{t("anonymousLogin.backToAccountLogin")}
				</Link>
			</div>
		</div>
	);
}
