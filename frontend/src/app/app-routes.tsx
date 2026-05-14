import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BaseLayout } from "./layouts/base-layout";
import { PrivateLayout } from "./layouts/private-layout";
import { GamePage } from "../pages/game";
import { GamesPage } from "../pages/games";
import { AnonymousLoginPage, LoginPage } from "../pages/login";
import { ProfilePage } from "../pages/profile";

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
