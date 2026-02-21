import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BaseLayout } from "./layouts/base-layout";
import { PrivateLayout } from "./layouts/private-layout";
import { GamesPage } from "../pages/games";
import { LoginPage } from "../pages/login";
import { GamePage } from "../pages/game";

export function AppRoutes() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<BaseLayout />}>
					<Route path="/login" element={<LoginPage />}></Route>
					<Route path="/" element={<PrivateLayout />}>
						<Route path="/games" element={<GamesPage />} />
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
