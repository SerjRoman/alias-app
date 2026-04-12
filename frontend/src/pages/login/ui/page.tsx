import { useState } from "react";
import styles from "./page.module.css";
import { useAuth } from "@entities/auth";
import { useMutation } from "@shared/api";

export function LoginPage() {
	const { setToken, setUser } = useAuth();
	const { mutate, isPending } = useMutation("post", "/auth/login");
	const [name, setName] = useState<string>("");
	const handleLogin = () => {
		if (!name.trim()) return;

		mutate(
			{ body: { name } },
			{
				onSuccess: (data) => {
					setToken(data.accessToken);
					setUser(data.user);
				},
			},
		);
	};

	return (
		<div className={styles.loginPage}>
			<div className={styles.loginCard}>
				<h1 className={styles.title}>Welcome to Alias!</h1>
				<input
					className={styles.input}
					type="text"
					value={name}
					onChange={(event) => setName(event.target.value)}
					placeholder="Enter your name"
					onKeyDown={(e) => e.key === "Enter" && handleLogin()}
				/>
				<button
					className={styles.button}
					onClick={handleLogin}
					disabled={isPending || !name.trim()}
				>
					{isPending ? "Logging in..." : "Enter the Game"}
				</button>
			</div>
		</div>
	);
}
