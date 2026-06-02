import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./page.module.css";
import { useAuth, type User } from "@entities/auth";
import { Button, Input } from "@shared/ui";
import { useMutation, translateApiError } from "@shared/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	loginSchema,
	registerSchema,
	type LoginValues,
	type RegisterValues,
} from "../model/schemas";
import { useTranslation } from "react-i18next";
import {
	LOGIN_ERROR_MESSAGES,
	REGISTER_ERROR_MESSAGES,
} from "../api/error.messages";

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
						key="login-form"
						className={styles.form}
						onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
					>
						<Input
							type="email"
							label={t("login.email")}
							error={loginForm.formState.errors.email?.message}
							autoComplete="email"
							{...loginForm.register("email")}
						/>

						<Input.Password
							label={t("login.password")}
							error={loginForm.formState.errors.password?.message}
							autoComplete="current-password"
							{...loginForm.register("password")}
						/>

						<Button
							className={styles.button}
							type="submit"
							disabled={loginMutation.isPending}
						>
							{loginMutation.isPending
								? t("common.loading")
								: t("login.submit")}
						</Button>

						{loginMutation.isError && (
							<div className={styles.serverError}>
								{translateApiError(t, loginMutation.error, LOGIN_ERROR_MESSAGES)}
							</div>
						)}
					</form>
				) : (
					<form
						key="register-form"
						className={styles.form}
						onSubmit={registerForm.handleSubmit(
							handleRegisterSubmit,
						)}
					>
						<Input
							type="text"
							label={t("register.name")}
							error={registerForm.formState.errors.name?.message}
							autoComplete="name"
							{...registerForm.register("name")}
						/>

						<Input
							type="text"
							label={t("register.username")}
							error={
								registerForm.formState.errors.username?.message
							}
							autoComplete="username"
							{...registerForm.register("username")}
						/>

						<Input
							type="email"
							label={t("register.email")}
							error={registerForm.formState.errors.email?.message}
							autoComplete="email"
							{...registerForm.register("email")}
						/>

						<Input.Password
							label={t("register.password")}
							error={
								registerForm.formState.errors.password?.message
							}
							autoComplete="new-password"
							{...registerForm.register("password")}
						/>

						<Button
							className={styles.button}
							type="submit"
							disabled={registerMutation.isPending}
						>
							{registerMutation.isPending
								? t("common.loading")
								: t("register.submit")}
						</Button>

						{registerMutation.isError && (
							<div className={styles.serverError}>
								{translateApiError(t, registerMutation.error, REGISTER_ERROR_MESSAGES)}
							</div>
						)}
					</form>
				)}

				<Link className={styles.secondaryLink} to="/login/anonymous">
					{t("login.asGuest")}
				</Link>
			</div>
		</div>
	);
}
