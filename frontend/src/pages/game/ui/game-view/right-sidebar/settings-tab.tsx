import { useState } from "react";
import { Sliders, ShoppingBag, Coins, Volume2 } from "lucide-react";
import styles from "./right-sidebar.module.css";

interface SettingsTabProps {
	walletBalance: number;
	onBuyItem?: (itemId: string, price: number) => void;
}

const STORE_ITEMS = [
	{
		id: "DOUBLE_POINTS",
		name: "×2 Points Booster",
		description: "Doubles points for guessed words next turn",
		price: 30,
	},
	{
		id: "FREEZE_NEXT_WORD",
		name: "Freeze Opponent",
		description: "Freezes enemy word button for 5 seconds",
		price: 40,
	},
	{
		id: "FREE_SKIP_SHIELD",
		name: "Free Skip Shield",
		description: "Cancels penalty for 1 skipped word",
		price: 25,
	},
];

export function SettingsTab({
	walletBalance,
	onBuyItem,
}: Readonly<SettingsTabProps>) {
	const [volume, setVolume] = useState(80);
	const [micSensitivity, setMicSensitivity] = useState(65);

	return (
		<div className={`${styles.settingsContainer} game-scroll`}>
			{/* Audio Settings */}
			<div className={styles.settingGroup}>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 6,
						fontSize: "12px",
						fontWeight: 700,
						color: "#f8fafc",
					}}
				>
					<Volume2 size={15} color="#38bdf8" />
					<span>Game SFX Volume ({volume}%)</span>
				</div>
				<input
					type="range"
					min="0"
					max="100"
					value={volume}
					onChange={(e) => setVolume(Number(e.target.value))}
					className={styles.settingInput}
				/>
			</div>

			<div className={styles.settingGroup}>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 6,
						fontSize: "12px",
						fontWeight: 700,
						color: "#f8fafc",
					}}
				>
					<Sliders size={15} color="#10b981" />
					<span>Mic Input Threshold ({micSensitivity}%)</span>
				</div>
				<input
					type="range"
					min="0"
					max="100"
					value={micSensitivity}
					onChange={(e) => setMicSensitivity(Number(e.target.value))}
					className={styles.settingInput}
				/>
			</div>

			{/* Power-Up Shop */}
			<div style={{ marginTop: "12px" }}>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						marginBottom: "10px",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							fontSize: "12px",
							fontWeight: 700,
							color: "#f8fafc",
						}}
					>
						<ShoppingBag size={15} color="#f59e0b" />
						<span>Tactical Item Shop</span>
					</div>
					<div
						style={{
							fontSize: "11px",
							fontWeight: 700,
							color: "#f59e0b",
							display: "flex",
							alignItems: "center",
							gap: 4,
						}}
					>
						<Coins size={12} />
						<span>{walletBalance}</span>
					</div>
				</div>

				<div className={styles.catalogGrid}>
					{STORE_ITEMS.map((item) => (
						<div key={item.id} className={styles.catalogItem}>
							<div className={styles.catalogInfo}>
								<span className={styles.catalogName}>{item.name}</span>
								<span className={styles.catalogDesc}>{item.description}</span>
							</div>

							<button
								type="button"
								className={styles.btnBuy}
								onClick={() => onBuyItem?.(item.id, item.price)}
							>
								<Coins size={12} />
								<span>{item.price}</span>
							</button>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
