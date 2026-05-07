import { useEffect, useRef } from "react";
import {
	useNavigate,
	Outlet,
	useLocation,
	useSearchParams,
} from "react-router-dom";
import styles from "./base-layout.module.css";
import { Header } from "@widgets/header";
import { useAuth } from "@entities/auth";
import { socketClient, useMutation } from "@shared/api";

export function BaseLayout() {
	const { token, setUser, setToken } = useAuth();

	const { mutate: getMe } = useMutation("get", "/user/me");
	const { mutate: checkActiveGame } = useMutation("get", "/games/current");
	const navigate = useNavigate();
	const location = useLocation();
	const gameLocation = useRef<{
		id: string;
		code: string | null;
	}>(null);

	const [searchParams] = useSearchParams();

	useEffect(() => {
		const code = searchParams.get("code");
		const id = searchParams.get("id");

		if (id) {
			gameLocation.current = { id, code };
		}
	}, [searchParams]);
	useEffect(() => {
		if (!token) {
			navigate(`/login`);
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
						if (gameLocation.current) {
							navigate(
								`/game?id=${gameLocation.current.id}${gameLocation.current.code ? `&code=${gameLocation.current.code}` : ""}`,
							);
							return;
						}
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
		searchParams,
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
