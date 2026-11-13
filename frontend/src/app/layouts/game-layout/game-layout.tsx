import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "@widgets/header";
import { GameStatus, useGameSlice } from "@entities/game";
import baseStyles from "../base-layout.module.css";
import styles from "./game-layout.module.css";

export function GameLayout() {
	const isInProgress = useGameSlice(
		(state) => state.game?.status === GameStatus.IN_PROGRESS,
	);

	if (isInProgress) {
		return (
			<div className={styles.gameLayout}>
				<Suspense
					fallback={
						<div className={styles.loaderContainer}>
							<span>Loading game...</span>
						</div>
					}
				>
					<Outlet />
				</Suspense>
			</div>
		);
	}

	return (
		<div className={baseStyles.layout}>
			<Header />
			<main className={baseStyles.main}>
				<Suspense
					fallback={
						<div className={baseStyles.spinnerContainer}>
							<div className={baseStyles.spinner} />
						</div>
					}
				>
					<Outlet />
				</Suspense>
			</main>
		</div>
	);
}
