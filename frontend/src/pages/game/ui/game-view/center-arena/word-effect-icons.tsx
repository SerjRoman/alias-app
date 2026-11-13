import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@shared/api";
import { useGameSlice } from "@entities/game";
import {
	getShopItemDescription,
	getShopItemFunnyName,
	getShopItemIcon,
} from "../../../model/shop-items";
import {
	ItemInfoPopover,
	type ItemPopoverData,
} from "./item-info-popover/item-info-popover";

interface WordEffectIconsProps {
	effectIds?: string[];
	className?: string;
	badgeClassName?: string;
}

export function WordEffectIcons({
	effectIds,
	className,
	badgeClassName,
}: Readonly<WordEffectIconsProps>) {
	const { t } = useTranslation();
	const roomId = useGameSlice((state) => state.game?.id ?? "");
	const hasEffects = Boolean(effectIds && effectIds.length > 0);

	const { data: shopCatalog } = useQuery(
		"get",
		"/games/{id}/shop",
		{
			params: {
				path: { id: roomId },
			},
		},
		{
			enabled: Boolean(roomId) && hasEffects,
		},
	);

	const catalogById = useMemo(() => {
		const map = new Map<
			string,
			NonNullable<typeof shopCatalog>["items"][number]
		>();
		for (const item of shopCatalog?.items ?? []) {
			map.set(item.id, item);
		}
		return map;
	}, [shopCatalog?.items]);

	if (!hasEffects || !effectIds) {
		return null;
	}

	return (
		<span className={className}>
			{effectIds.map((effectId, idx) => {
				const catalogItem = catalogById.get(effectId);
				const icon = getShopItemIcon(effectId);
				const popoverItem: ItemPopoverData = {
					name: getShopItemFunnyName(effectId, catalogItem?.name, t),
					description: getShopItemDescription(
						effectId,
						catalogItem?.description,
						t,
					),
					icon,
					target: catalogItem?.target,
				};

				return (
					<ItemInfoPopover
						key={`${effectId}-${idx}`}
						item={popoverItem}
						align="center"
					>
						<button
							type="button"
							className={badgeClassName}
							title={popoverItem.name}
							aria-label={popoverItem.name}
						>
							{icon}
						</button>
					</ItemInfoPopover>
				);
			})}
		</span>
	);
}
