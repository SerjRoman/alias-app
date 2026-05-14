import { type SubmitEvent, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./page.module.css";
import { useAuth, type User } from "@entities/auth";
import { useMutation } from "@shared/api";

type AuthTab = "login" | "register";

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

export function LoginPage() {
	const { setToken, setUser } = useAuth();
	const [activeTab, setActiveTab] = useState<AuthTab>("login");
	const [loginForm, setLoginForm] = useState({
		email: "",
		password: "",
	});
	const [registerForm, setRegisterForm] = useState({
		email: "",
		name: "",
		username: "",
		password: "",
	});

	const loginMutation = useMutation("post", "/user/login");
	const registerMutation = useMutation("post", "/user/register");

	const handleLoginSubmit = (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();

		loginMutation.mutate(
			{
				body: {
					email: loginForm.email.trim(),
					password: loginForm.password,
				},
			},
			{
				onSuccess: (data) => applyAuthResult(setToken, setUser, data),
			},
		);
	};

	const handleRegisterSubmit = (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();

		registerMutation.mutate(
			{
				body: {
					email: registerForm.email.trim(),
					name: registerForm.name.trim(),
					username: registerForm.username.trim(),
					password: registerForm.password,
				},
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
					<p className={styles.kicker}>Account access</p>
					<h1 className={styles.title}>Welcome to Alias!</h1>
					<p className={styles.description}>
						Log in to your account or create a new one to keep your
						progress.
					</p>
				</div>

				<div
					className={styles.tabs}
					role="tablist"
					aria-label="Authentication mode"
				>
					<button
						type="button"
						className={`${styles.tab} ${activeTab === "login" ? styles.tabActive : ""}`}
						onClick={() => setActiveTab("login")}
					>
						Login
					</button>
					<button
						type="button"
						className={`${styles.tab} ${activeTab === "register" ? styles.tabActive : ""}`}
						onClick={() => setActiveTab("register")}
					>
						Register
					</button>
				</div>

				{activeTab === "login" ? (
					<form className={styles.form} onSubmit={handleLoginSubmit}>
						<label className={styles.field}>
							<span className={styles.label}>Email</span>
							<input
								className={styles.input}
								type="email"
								autoComplete="email"
								value={loginForm.email}
								onChange={(event) =>
									setLoginForm((current) => ({
										...current,
										email: event.target.value,
									}))
								}
								required
							/>
						</label>

						<label className={styles.field}>
							<span className={styles.label}>Password</span>
							<input
								className={styles.input}
								type="password"
								autoComplete="current-password"
								value={loginForm.password}
								onChange={(event) =>
									setLoginForm((current) => ({
										...current,
										password: event.target.value,
									}))
								}
								required
							/>
						</label>

						<button
							className={styles.button}
							type="submit"
							disabled={loginMutation.isPending}
						>
							{loginMutation.isPending
								? "Logging in..."
								: "Log in"}
						</button>
					</form>
				) : (
					<form
						className={styles.form}
						onSubmit={handleRegisterSubmit}
					>
						<label className={styles.field}>
							<span className={styles.label}>Name</span>
							<input
								className={styles.input}
								type="text"
								autoComplete="name"
								value={registerForm.name}
								onChange={(event) =>
									setRegisterForm((current) => ({
										...current,
										name: event.target.value,
									}))
								}
								required
							/>
						</label>

						<label className={styles.field}>
							<span className={styles.label}>Username</span>
							<input
								className={styles.input}
								type="text"
								autoComplete="username"
								value={registerForm.username}
								onChange={(event) =>
									setRegisterForm((current) => ({
										...current,
										username: event.target.value,
									}))
								}
								required
							/>
						</label>

						<label className={styles.field}>
							<span className={styles.label}>Email</span>
							<input
								className={styles.input}
								type="email"
								autoComplete="email"
								value={registerForm.email}
								onChange={(event) =>
									setRegisterForm((current) => ({
										...current,
										email: event.target.value,
									}))
								}
								required
							/>
						</label>

						<label className={styles.field}>
							<span className={styles.label}>Password</span>
							<input
								className={styles.input}
								type="password"
								autoComplete="new-password"
								value={registerForm.password}
								onChange={(event) =>
									setRegisterForm((current) => ({
										...current,
										password: event.target.value,
									}))
								}
								required
							/>
						</label>

						<button
							className={styles.button}
							type="submit"
							disabled={registerMutation.isPending}
						>
							{registerMutation.isPending
								? "Creating account..."
								: "Register"}
						</button>
					</form>
				)}

				<Link className={styles.secondaryLink} to="/login/anonymous">
					Continue as guest
				</Link>
			</div>
		</div>
	);
}
