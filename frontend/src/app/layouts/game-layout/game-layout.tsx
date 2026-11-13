import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import styles from "./game-layout.module.css";

export function GameLayout() {
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
