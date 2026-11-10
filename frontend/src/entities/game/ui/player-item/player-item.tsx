import { User, Crown, ArrowLeft } from "lucide-react";
import styles from "./player-item.module.css";

interface PlayerItemProps {
	id: string;
	name: string;
	isOwner: boolean;
	isReady: boolean;
	isExplainer: boolean;
	isOnline: boolean;
}

export function PlayerItem({
	name,
	isExplainer,
	isOwner,
	isOnline,
	isReady,
}: Readonly<PlayerItemProps>) {
	const itemClasses = `${styles.item} ${isReady ? styles.ready : ""} ${isOnline ? "" : styles.offline}`;

	return (
		<li className={itemClasses}>
			<User size={16} color="#666" />

			<span className={styles.name}>{name || "Unknown"}</span>

			{isOwner && (
				<Crown
					size={14}
					className={styles.ownerIcon}
					fill="currentColor"
					aria-label="Room Owner"
				/>
			)}

			{isExplainer && (
				<ArrowLeft
					size={16}
					className={styles.explainerIcon}
					strokeWidth={2.5}
					aria-label="Current Explainer"
				/>
			)}
		</li>
	);
}
