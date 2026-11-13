import type React from "react";
import { useTranslation } from "react-i18next";
import * as Popover from "@radix-ui/react-popover";
import type { EffectTargetType } from "@entities/game";
import { EFFECT_TARGET_LABEL_KEYS } from "../../../../model/shop-items";
import styles from "./item-info-popover.module.css";

export interface ItemPopoverData {
	name: string;
	description?: string;
	icon: React.ReactNode;
	target?: EffectTargetType;
}

interface ItemInfoPopoverProps {
	item: ItemPopoverData;
	children: React.ReactNode;
	side?: Popover.PopoverContentProps["side"];
	align?: Popover.PopoverContentProps["align"];
}

export function ItemInfoPopover({
	item,
	children,
	side = "top",
	align = "start",
}: Readonly<ItemInfoPopoverProps>) {
	const { t } = useTranslation();

	return (
		<Popover.Root>
			<Popover.Trigger asChild>{children}</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content
					className={styles.itemPopover}
					side={side}
					align={align}
					sideOffset={6}
					collisionPadding={12}
				>
					<div className={styles.itemPopoverHeader}>
						<div className={styles.itemPopoverIcon}>{item.icon}</div>
						<span className={styles.itemPopoverTitle}>
							{item.name}
						</span>
					</div>
					{item.description && (
						<p className={styles.itemPopoverDesc}>
							{item.description}
						</p>
					)}
					{item.target && (
						<span className={styles.itemPopoverTarget}>
							{t(EFFECT_TARGET_LABEL_KEYS[item.target])}
						</span>
					)}
					<Popover.Arrow className={styles.itemPopoverArrow} />
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}
