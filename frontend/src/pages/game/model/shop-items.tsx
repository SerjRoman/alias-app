import type React from "react";
import type { TFunction } from "i18next";
import {
	Bomb,
	CloudRain,
	FlipVertical2,
	Hourglass,
	MicOff,
	RefreshCw,
	Shield,
	ShieldCheck,
	Shuffle,
	Snowflake,
	Sparkles,
	Timer,
	TimerOff,
} from "lucide-react";
import type { EffectTargetType } from "@entities/game";

export interface ArenaShopItem {
	id: string;
	name: string;
	description: string;
	price: number;
	icon: React.ReactNode;
	target?: EffectTargetType;
	isAvailable?: boolean;
}

export const MAX_INVENTORY_SLOTS = 3;

export interface ShopItemMeta {
	funnyName: string;
	icon: React.ReactNode;
}

export const SHOP_ITEMS_META: Record<string, ShopItemMeta> = {
	TIMER_PLUS_10: {
		funnyName: "Машина времени (на 10 сек)",
		icon: <Hourglass size={15} />,
	},
	DOUBLE_POINTS: {
		funnyName: "Двойной кэшбэк",
		icon: <Sparkles size={15} />,
	},
	FREE_SKIP_SHIELD: {
		funnyName: "Отмазка от скипа",
		icon: <Shield size={15} />,
	},
	FREEZE_NEXT_WORD: {
		funnyName: "Мороз по коже",
		icon: <Snowflake size={15} />,
	},
	WORD_SWAP: {
		funnyName: "Подмена понятий",
		icon: <Shuffle size={15} />,
	},
	ENEMY_SKIP_PENALTY: {
		funnyName: "Кармический бумеранг",
		icon: <Bomb size={15} />,
	},
	FOG_WORD: {
		funnyName: "Ёжик в тумане",
		icon: <CloudRain size={15} />,
	},
	VOICE_MUTE: {
		funnyName: "Обет молчания",
		icon: <MicOff size={15} />,
	},
	CLEANSE: {
		funnyName: "Антидот",
		icon: <ShieldCheck size={15} />,
	},
	EXTRA_TIME: {
		funnyName: "+10 секунд",
		icon: <Timer size={15} />,
	},
	TIME_DRAIN: {
		funnyName: "-5 секунд",
		icon: <TimerOff size={15} />,
	},
	FLIP_WORD: {
		funnyName: "Перевёртыш",
		icon: <FlipVertical2 size={15} />,
	},
	REROLL_WORD: {
		funnyName: "Замена слова",
		icon: <RefreshCw size={15} />,
	},
};

export const EFFECT_TARGET_LABELS: Record<EffectTargetType, string> = {
	self_team: "Цель: своя команда",
	enemy_team: "Цель: вражеская команда",
	enemy_player: "Цель: вражеский игрок",
};

export const EFFECT_TARGET_LABEL_KEYS: Record<
	EffectTargetType,
	| "gameView.targetSelfTeam"
	| "gameView.targetEnemyTeam"
	| "gameView.targetEnemyPlayer"
> = {
	self_team: "gameView.targetSelfTeam",
	enemy_team: "gameView.targetEnemyTeam",
	enemy_player: "gameView.targetEnemyPlayer",
};

export function getShopItemIcon(itemId: string): React.ReactNode {
	return SHOP_ITEMS_META[itemId]?.icon ?? <Sparkles size={15} />;
}

export function getShopItemFunnyName(
	itemId: string,
	fallbackName?: string,
	t?: TFunction,
): string {
	const defaultVal =
		SHOP_ITEMS_META[itemId]?.funnyName ?? fallbackName ?? itemId;
	if (t) {
		return t(`gameView.items.${itemId}`, {
			defaultValue: defaultVal,
		}) as string;
	}
	return defaultVal;
}

export function getShopItemDescription(
	itemId: string,
	fallbackDescription?: string,
	t?: TFunction,
): string | undefined {
	if (t) {
		return t(`gameView.itemDescriptions.${itemId}`, {
			defaultValue: fallbackDescription ?? "",
		}) as string;
	}
	return fallbackDescription;
}
