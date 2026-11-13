import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import styles from "./base-layout.module.css";
import { Header } from "@widgets/header";

function PageLoader() {
	return (
		<div className={styles.spinnerContainer}>
			<div className={styles.spinner} />
		</div>
	);
}

export function BaseLayout() {
	return (
		<div className={styles.layout}>
			<Header />
			<main className={styles.main}>
				<Suspense fallback={<PageLoader />}>
					<Outlet />
				</Suspense>
			</main>
		</div>
	);
}
