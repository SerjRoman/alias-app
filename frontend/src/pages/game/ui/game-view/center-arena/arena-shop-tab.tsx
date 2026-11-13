import { useTranslation } from "react-i18next";
import { Coins, Plus } from "lucide-react";
import { Button } from "@shared/ui";
import {
	MAX_INVENTORY_SLOTS,
	type ArenaShopItem,
} from "../../../model/shop-items";
import { ItemInfoPopover } from "./item-info-popover/item-info-popover";
import styles from "./arena-shop-tab.module.css";

interface ArenaShopTabProps {
	items: ArenaShopItem[];
	inventory: (ArenaShopItem | null)[];
	walletBalance: number;
	maxInventorySize?: number;
	onActivateSlot: (index: number) => void;
	onBuyItem: (item: ArenaShopItem) => void;
}

export function ArenaShopTab({
	items,
	inventory,
	walletBalance,
	maxInventorySize = MAX_INVENTORY_SLOTS,
	onActivateSlot,
	onBuyItem,
}: Readonly<ArenaShopTabProps>) {
	const { t } = useTranslation();
	const occupiedSlotsCount = inventory.filter((s) => s !== null).length;
	const isInventoryFull = occupiedSlotsCount >= maxInventorySize;

	return (
		<div className={`${styles.dockContent} game-scroll`}>
			{/* Section 1: Player Inventory Slots */}
			<div className={styles.shopSection}>
				<div className={styles.sectionHeader}>
					<span>
						{t("gameView.activeInventory")} ({occupiedSlotsCount}/
						{maxInventorySize} {t("gameView.slots")})
					</span>
				</div>

				<div className={styles.inventorySlotsRow}>
					{inventory.map((slotItem, idx) => {
						if (slotItem) {
							return (
								<div
									key={`slot-${idx}`}
									className={styles.inventorySlot}
								>
									<ItemInfoPopover item={slotItem}>
										<button
											type="button"
											className={`${styles.inventorySlotInfo} ${styles.infoTrigger}`}
											title={t("gameView.itemInfoTooltip")}
										>
											<div
												className={
													styles.inventorySlotIcon
												}
											>
												{slotItem.icon}
											</div>
											<div
												className={
													styles.inventorySlotDetails
												}
											>
												<span
													className={
														styles.inventorySlotName
													}
												>
													{slotItem.name}
												</span>
											</div>
										</button>
									</ItemInfoPopover>

									<Button
										type="button"
										variant="primary"
										size="small"
										className={styles.btnActivateSlot}
										onClick={() => onActivateSlot(idx)}
										title={`${t("gameView.activate")} ${slotItem.name}`}
									>
										<span>{t("gameView.activate")}</span>
									</Button>
								</div>
							);
						}

						return (
							<div
								key={`empty-slot-${idx}`}
								className={styles.inventorySlotEmpty}
							>
								<Plus size={13} />
								<span>
									{t("gameView.emptySlot")} #{idx + 1}
								</span>
							</div>
						);
					})}
				</div>
			</div>

			{/* Section 2: Store Catalog */}
			<div className={styles.shopSection}>
				<div className={styles.sectionHeader}>
					<span>{t("gameView.itemsCatalog")}</span>
				</div>

				<div className={styles.shopGrid}>
					{items.map((item) => {
						const isAvailable = item.isAvailable ?? true;
						const canAfford = walletBalance >= item.price;
						const canBuy =
							isAvailable && canAfford && !isInventoryFull;

						return (
							<div key={item.id} className={styles.shopCard}>
								<ItemInfoPopover item={item}>
									<button
										type="button"
										className={`${styles.shopCardInfo} ${styles.infoTrigger}`}
										title={t("gameView.itemInfoTooltip")}
									>
										<div className={styles.shopCardIcon}>
											{item.icon}
										</div>
										<div className={styles.shopCardDetails}>
											<span
												className={styles.shopCardName}
											>
												{item.name}
											</span>
										</div>
									</button>
								</ItemInfoPopover>

								<Button
									type="button"
									variant="secondary"
									size="small"
									className={styles.btnShopBuy}
									onClick={() => onBuyItem(item)}
									disabled={!canBuy}
									title={
										!isAvailable
											? t("gameView.unavailable")
											: isInventoryFull
												? t("gameView.inventoryFull")
												: item.name
									}
								>
									<Coins size={12} />
									<span>
										{!isAvailable
											? t("gameView.unavailableShort")
											: isInventoryFull
												? t("gameView.inventoryFull")
												: item.price}
									</span>
								</Button>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
