import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./page.module.css";
import { useAuth, type User } from "@entities/auth";
import { useMutation } from "@shared/api";
import { Button } from "@shared/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	loginSchema,
	registerSchema,
	type LoginValues,
	type RegisterValues,
} from "../model/schemas";
import { useTranslation } from "react-i18next";

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
	const { t } = useTranslation();
	const loginMutation = useMutation("post", "/user/login");
	const registerMutation = useMutation("post", "/user/register");

	const loginForm = useForm<LoginValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: "", password: "" },
	});

	const registerForm = useForm<RegisterValues>({
		resolver: zodResolver(registerSchema),
		defaultValues: { name: "", username: "", email: "", password: "" },
	});

	const handleLoginSubmit = (data: LoginValues) => {
		loginMutation.mutate(
			{
				body: {
					email: data.email.trim(),
					password: data.password,
				},
			},
			{
				onSuccess: (data) => applyAuthResult(setToken, setUser, data),
			},
		);
	};

	const handleRegisterSubmit = (data: RegisterValues) => {
		registerMutation.mutate(
			{
				body: {
					email: data.email.trim(),
					name: data.name.trim(),
					username: data.username.trim(),
					password: data.password,
				},
			},
			{
				onSuccess: (data) => applyAuthResult(setToken, setUser, data),
			},
		);
	};

	const errorStyle = {
		color: "#e57373",
		fontSize: "0.8rem",
		marginTop: "4px",
	};

	return (
		<div className={styles.loginPage}>
			<div className={styles.loginCard}>
				<div className={styles.header}>
					<p className={styles.kicker}>{t("login.access")}</p>
					<h1 className={styles.title}>{t("login.title")}</h1>
					<p className={styles.description}>
						{t("login.description")}
					</p>
				</div>

				<div
					className={styles.tabs}
					role="tablist"
					aria-label="Authentication mode"
				>
					<Button
						type="button"
						className={`${styles.tab} ${activeTab === "login" ? styles.tabActive : ""}`}
						onClick={() => setActiveTab("login")}
					>
						{t("login.login")}
					</Button>
					<Button
						type="button"
						className={`${styles.tab} ${activeTab === "register" ? styles.tabActive : ""}`}
						onClick={() => setActiveTab("register")}
					>
						{t("register.register")}
					</Button>
				</div>

				{activeTab === "login" ? (
					<form
						className={styles.form}
						onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
					>
						<label className={styles.field}>
							<span className={styles.label}>
								{t("login.email")}
							</span>
							<input
								className={styles.input}
								type="email"
								autoComplete="email"
								{...loginForm.register("email")}
							/>
							{loginForm.formState.errors.email && (
								<span style={errorStyle}>
									{loginForm.formState.errors.email.message}
								</span>
							)}
						</label>

						<label className={styles.field}>
							<span className={styles.label}>
								{t("login.password")}
							</span>
							<input
								className={styles.input}
								type="password"
								autoComplete="current-password"
								{...loginForm.register("password")}
							/>
							{loginForm.formState.errors.password && (
								<span style={errorStyle}>
									{
										loginForm.formState.errors.password
											.message
									}
								</span>
							)}
						</label>

						<Button
							className={styles.button}
							type="submit"
							disabled={loginMutation.isPending}
						>
							{loginMutation.isPending
								? t("common.loading")
								: t("login.submit")}
						</Button>
					</form>
				) : (
					<form
						className={styles.form}
						onSubmit={registerForm.handleSubmit(
							handleRegisterSubmit,
						)}
					>
						<label className={styles.field}>
							<span className={styles.label}>
								{t("register.name")}
							</span>
							<input
								className={styles.input}
								type="text"
								autoComplete="name"
								{...registerForm.register("name")}
							/>
							{registerForm.formState.errors.name && (
								<span style={errorStyle}>
									{registerForm.formState.errors.name.message}
								</span>
							)}
						</label>

						<label className={styles.field}>
							<span className={styles.label}>
								{t("register.username")}
							</span>
							<input
								className={styles.input}
								type="text"
								autoComplete="username"
								{...registerForm.register("username")}
							/>
							{registerForm.formState.errors.username && (
								<span style={errorStyle}>
									{
										registerForm.formState.errors.username
											.message
									}
								</span>
							)}
						</label>

						<label className={styles.field}>
							<span className={styles.label}>
								{t("register.email")}
							</span>
							<input
								className={styles.input}
								type="email"
								autoComplete="email"
								{...registerForm.register("email")}
							/>
							{registerForm.formState.errors.email && (
								<span style={errorStyle}>
									{
										registerForm.formState.errors.email
											.message
									}
								</span>
							)}
						</label>

						<label className={styles.field}>
							<span className={styles.label}>
								{t("register.password")}
							</span>
							<input
								className={styles.input}
								type="password"
								autoComplete="new-password"
								{...registerForm.register("password")}
							/>
							{registerForm.formState.errors.password && (
								<span style={errorStyle}>
									{
										registerForm.formState.errors.password
											.message
									}
								</span>
							)}
						</label>

						<Button
							className={styles.button}
							type="submit"
							disabled={registerMutation.isPending}
						>
							{registerMutation.isPending
								? t("common.loading")
								: t("register.submit")}
						</Button>
					</form>
				)}

				<Link className={styles.secondaryLink} to="/login/anonymous">
					{t("login.asGuest")}
				</Link>
			</div>
		</div>
	);
}
