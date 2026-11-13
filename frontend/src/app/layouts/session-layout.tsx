import { useEffect, useRef } from "react";
import {
	useNavigate,
	Outlet,
	useLocation,
	useSearchParams,
} from "react-router-dom";
import { socketClient, useMutation, useAuth } from "@shared/api";

export function SessionLayout() {
	const { token, user, setUser, setToken, hasHydrated } = useAuth();

	const { mutate: getMe } = useMutation("get", "/user/me");
	const { mutate: checkActiveGame } = useMutation("get", "/games/current");
	const navigate = useNavigate();
	const location = useLocation();
	const validatedTokenRef = useRef<string | null>(null);
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
		if (!hasHydrated) return;

		if (!token) {
			validatedTokenRef.current = null;
			if (user) {
				setUser(null);
			}
			if (socketClient.connected) {
				socketClient.disconnect();
			}
			return;
		}

		if (validatedTokenRef.current === token) {
			if (!socketClient.connected) {
				socketClient.auth = { token: `Bearer ${token}` };
				socketClient.connect();
			}
			return;
		}

		validatedTokenRef.current = token;
		getMe(
			{
				headers: {
					Authorization: `Bearer ${token}`,
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
				onError: (error) => {
					console.error(
						"Failed to fetch user data. Logging out.",
						error,
					);
					setToken(null);
					setUser(null);
					navigate("/login", { replace: true });
				},
			},
		);
	}, [
		getMe,
		hasHydrated,
		navigate,
		setToken,
		setUser,
		token,
		user,
	]);

	useEffect(() => {
		if (!hasHydrated || !token || !user) return;

		const isLandingRoute =
			location.pathname === "/" || location.pathname.startsWith("/login");
		if (!isLandingRoute) return;

		checkActiveGame(
			{
				headers: {
					Authorization: `Bearer ${token}`,
					"ngrok-skip-browser-warning": "true",
				},
			},
			{
				onSuccess: () => {
					if (gameLocation.current) {
						navigate(
							`/game?id=${gameLocation.current.id}${gameLocation.current.code ? `&code=${gameLocation.current.code}` : ""}`,
						);
						return;
					}
					navigate("/games");
				},
				onError: (error) => {
					console.error("Failed to check active game.", error);
					navigate("/games");
				},
			},
		);
	}, [
		checkActiveGame,
		hasHydrated,
		location.pathname,
		navigate,
		token,
		user,
	]);

	return <Outlet />;
}
