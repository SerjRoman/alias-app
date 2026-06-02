import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BaseLayout } from "./layouts/base-layout";
import { PrivateLayout } from "./layouts/private-layout";
import { lazy } from "react";

const GamePage = lazy(() =>
	import("../pages/game").then((module) => ({ default: module.GamePage })),
);
const GamesPage = lazy(() =>
	import("../pages/games").then((module) => ({ default: module.GamesPage })),
);
const LoginPage = lazy(() =>
	import("../pages/login").then((module) => ({ default: module.LoginPage })),
);
const AnonymousLoginPage = lazy(() =>
	import("../pages/login").then((module) => ({
		default: module.AnonymousLoginPage,
	})),
);
const ProfilePage = lazy(() =>
	import("../pages/profile").then((module) => ({
		default: module.ProfilePage,
	})),
);

export function AppRoutes() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<BaseLayout />}>
					<Route path="/login" element={<LoginPage />}></Route>
					<Route
						path="/login/anonymous"
						element={<AnonymousLoginPage />}
					/>
					<Route path="/" element={<PrivateLayout />}>
						<Route path="/games" element={<GamesPage />} />
						<Route
							path="/profile/:userId"
							element={<ProfilePage />}
						/>
						<Route
							path="/games/:roomId/teams"
							element={<div>Teams page</div>}
						/>
						<Route path="/game" element={<GamePage />} />
					</Route>
				</Route>
			</Routes>
		</BrowserRouter>
	);
}
