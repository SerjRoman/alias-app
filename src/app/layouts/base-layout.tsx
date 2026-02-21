import { useEffect } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import { useMutation } from "../../shared/api";
import { useAuth } from "../../entities/auth/model";
import styles from "./base-layout.module.css";
import { socketClient } from "../../shared/api/socket";

export function BaseLayout() {
	const { token, user, setUser, setToken } = useAuth();
	const { mutate: getMe } = useMutation("get", "/auth/me");
	const { mutate: checkActiveGame } = useMutation("get", "/games/current");
	const navigate = useNavigate();
	const location = useLocation();
	useEffect(() => {
		if (!token) {
			navigate("/login");
			return;
		}

		getMe(
			{ headers: { Authorization: `Bearer ${token}` } },
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
			<header className={styles.header}>
				<Link to="/games" className={styles.logo}>
					Alias Game
				</Link>
				{user && (
					<div>
						<span>Welcome, {user.name}!</span>
					</div>
				)}
			</header>
			<main className={styles.main}>
				<Outlet />
			</main>
		</div>
	);
}
