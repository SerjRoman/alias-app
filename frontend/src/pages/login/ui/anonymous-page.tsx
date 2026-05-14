import { type SubmitEvent, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./page.module.css";
import { useAuth, type User } from "@entities/auth";
import { useMutation } from "@shared/api";

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
					<p className={styles.kicker}>Guest access</p>
					<h1 className={styles.title}>Join as anonymous</h1>
					<p className={styles.description}>
						Enter a guest name and start playing without creating an
						account.
					</p>
				</div>

				<form className={styles.form} onSubmit={handleSubmit}>
					<label className={styles.field}>
						<span className={styles.label}>Guest name</span>
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

					<button
						className={styles.button}
						type="submit"
						disabled={isPending}
					>
						{isPending ? "Entering..." : "Enter as guest"}
					</button>
				</form>

				<Link className={styles.secondaryLink} to="/login">
					Back to account login
				</Link>
			</div>
		</div>
	);
}
