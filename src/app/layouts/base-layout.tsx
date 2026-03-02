import { useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import styles from "./base-layout.module.css";
import { Header } from "@widgets/header";
import { useAuth } from "@entities/auth";
import { socketClient, useMutation } from "@shared/api";

export function BaseLayout() {
	const { token, setUser, setToken } = useAuth();

	const { mutate: getMe } = useMutation("get", "/auth/me");
	const { mutate: checkActiveGame } = useMutation("get", "/games/current");
	const navigate = useNavigate();
	const location = useLocation();
	useEffect(() => {
		if (!token) {
			navigate("/login");
			setUser(null);
			return;
		}

		getMe(
			{
				headers: {
					Authorization: `Bearer ${token}`,
					"ngrok-skip-browser-warning": "true",
				},
			},
			{
				onSuccess: (data) => {
					console.log(data);
					if (!socketClient.connected) {
						socketClient.auth = { token: `Bearer ${token}` };
						socketClient.connect();
					}

					setUser(data);
				},
				onError: () => {
					setToken(null);
					navigate("/login");
				},
			},
		);
		checkActiveGame(
			{
				headers: {
					Authorization: `Bearer ${token}`,
					"ngrok-skip-browser-warning": "true",
				},
			},
			{
				onSuccess: () => {
					if (location.pathname === "/game") {
						return;
					} else if (
						location.pathname === "/" ||
						location.pathname === "/login"
					) {
						navigate("/games");
					}
				},
				onError: () => {
					navigate("/games");
				},
			},
		);
	}, [
		checkActiveGame,
		getMe,
		location.pathname,
		navigate,
		setToken,
		setUser,
		token,
	]);

	return (
		<div className={styles.layout}>
			<Header />
			<main className={styles.main}>
				<Outlet />
			</main>
		</div>
	);
}
