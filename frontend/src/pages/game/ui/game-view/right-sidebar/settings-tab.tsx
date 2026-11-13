import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Sliders,
	ShoppingBag,
	Coins,
	Volume2,
	BookOpen,
	Settings2,
} from "lucide-react";
import { useGameSlice } from "@entities/game";
import { useQuery } from "@shared/api";
import { Button } from "@shared/ui";
import {
	getShopItemDescription,
	getShopItemFunnyName,
	getShopItemIcon,
} from "../../../model/shop-items";
import styles from "./right-sidebar.module.css";

export interface SettingsShopItem {
	id: string;
	name: string;
	description: string;
	price: number;
	isAvailable?: boolean;
}

interface WordPackSummary {
	id: string;
	name: string;
}

interface SettingsTabProps {
	walletBalance: number;
	shopItems?: SettingsShopItem[];
	isShopEnabled?: boolean;
	onBuyItem?: (itemId: string, price: number) => void;
}

export function SettingsTab({
	walletBalance,
	shopItems = [],
	isShopEnabled = true,
	onBuyItem,
}: Readonly<SettingsTabProps>) {
	const { t } = useTranslation();
	const [volume, setVolume] = useState(80);
	const [micSensitivity, setMicSensitivity] = useState(65);

	const settings = useGameSlice((state) => state.game?.settings);
	const hasPackSelections = Boolean(settings?.wordPackSelections?.length);
	const { data: wordPacksData } = useQuery(
		"get",
		"/word-packs",
		undefined,
		{
			enabled: hasPackSelections,
		},
	);

	const packNamesById = useMemo(() => {
		const map = new Map<string, string>();
		const packs = (wordPacksData ?? []) as unknown as WordPackSummary[];
		for (const pack of packs) {
			map.set(pack.id, pack.name);
		}
		return map;
	}, [wordPacksData]);

	return (
		<div className={`${styles.settingsContainer} game-scroll`}>
			{/* Audio Settings */}
			<div className={styles.settingGroup}>
				<div className={styles.settingHeader}>
					<Volume2 size={15} color="#38bdf8" />
					<span>
						{t("gameView.sfxVolume")} ({volume}%)
					</span>
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
				<div className={styles.settingHeader}>
					<Sliders size={15} color="#10b981" />
					<span>
						{t("gameView.micThreshold")} ({micSensitivity}%)
					</span>
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

			{/* Current Game Settings */}
			{settings && (
				<div className={styles.shopSectionContainer}>
					<div className={styles.shopHeader}>
						<div className={styles.shopHeaderTitle}>
							<Settings2 size={15} color="#60a5fa" />
							<span>{t("gameView.currentGameSettings")}</span>
						</div>
					</div>

					<div className={styles.gameSettingsCard}>
						<div className={styles.gameSettingRow}>
							<span className={styles.gameSettingLabel}>
								{t("gameView.roundTime")}
							</span>
							<span className={styles.gameSettingValue}>
								{settings.roundTimeSeconds}{" "}
								{t("gameView.secondsShort")}
							</span>
						</div>
						<div className={styles.gameSettingRow}>
							<span className={styles.gameSettingLabel}>
								{t("gameView.pointsToWin")}
							</span>
							<span className={styles.gameSettingValue}>
								{settings.pointsToWin}
							</span>
						</div>
						<div className={styles.gameSettingRow}>
							<span className={styles.gameSettingLabel}>
								{t("gameView.roomPrivacy")}
							</span>
							<span className={styles.gameSettingValue}>
								{settings.isPrivate
									? t("gameView.privateRoom")
									: t("gameView.publicRoom")}
							</span>
						</div>
						<div className={styles.gameSettingRow}>
							<span className={styles.gameSettingLabel}>
								{t("gameView.hatMode")}
							</span>
							<span className={styles.gameSettingValue}>
								{settings.isHatMode
									? `${t("gameView.enabled")} (${settings.wordsPerPlayer ?? 0} ${t("gameView.wordsShort")})`
									: t("gameView.disabled")}
							</span>
						</div>
						<div className={styles.gameSettingRow}>
							<span className={styles.gameSettingLabel}>
								{t("gameView.voiceChat")}
							</span>
							<span className={styles.gameSettingValue}>
								{settings.isVoiceChatEnabled
									? t("gameView.enabled")
									: t("gameView.disabled")}
							</span>
						</div>
						<div className={styles.gameSettingRow}>
							<span className={styles.gameSettingLabel}>
								{t("gameView.itemShop")}
							</span>
							<span className={styles.gameSettingValue}>
								{settings.isShopEnabled
									? t("gameView.enabled")
									: t("gameView.disabled")}
							</span>
						</div>
					</div>
				</div>
			)}

			{/* Selected Word Packs */}
			{settings?.wordPackSelections &&
				settings.wordPackSelections.length > 0 && (
					<div className={styles.shopSectionContainer}>
						<div className={styles.shopHeader}>
							<div className={styles.shopHeaderTitle}>
								<BookOpen size={15} color="#a78bfa" />
								<span>{t("gameView.selectedPacks")}</span>
							</div>
						</div>

						<div className={styles.packsList}>
							{settings.wordPackSelections.map((sel) => (
								<div
									key={sel.packId}
									className={styles.packChip}
								>
									<span className={styles.packName}>
										{packNamesById.get(sel.packId) ??
											sel.packId}
									</span>
									<span className={styles.packCount}>
										{sel.count} {t("gameView.wordsShort")}
									</span>
								</div>
							))}
						</div>
					</div>
				)}

			{/* Power-Up Shop */}
			{isShopEnabled && (
				<div className={styles.shopSectionContainer}>
					<div className={styles.shopHeader}>
						<div className={styles.shopHeaderTitle}>
							<ShoppingBag size={15} color="#f59e0b" />
							<span>{t("gameView.tacticalItemShop")}</span>
						</div>
						<div className={styles.shopHeaderWallet}>
							<Coins size={12} />
							<span>{walletBalance}</span>
						</div>
					</div>

					<div className={styles.catalogGrid}>
						{shopItems.map((item) => {
							const isAvailable = item.isAvailable ?? true;
							const canAfford = walletBalance >= item.price;

							return (
								<div
									key={item.id}
									className={styles.catalogItem}
								>
									<div className={styles.catalogInfo}>
										<div className={styles.catalogHeader}>
											<div className={styles.catalogIcon}>
												{getShopItemIcon(item.id)}
											</div>
											<span
												className={styles.catalogName}
											>
												{getShopItemFunnyName(
													item.id,
													item.name,
													t,
												)}
											</span>
										</div>
										<span className={styles.catalogDesc}>
											{getShopItemDescription(
												item.id,
												item.description,
												t,
											)}
										</span>
									</div>

									<Button
										type="button"
										variant="secondary"
										size="small"
										className={styles.btnBuy}
										disabled={!isAvailable || !canAfford}
										onClick={() =>
											onBuyItem?.(item.id, item.price)
										}
									>
										<Coins size={14} />
										<span>
											{!isAvailable
												? t("gameView.unavailableShort")
												: item.price}
										</span>
									</Button>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
