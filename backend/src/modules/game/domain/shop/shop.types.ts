import type { EffectItemId } from "../state/game.state";
import { GameError } from "../errors/game.errors";
import { GameErrorCode } from "../errors/error-codes";

export type ShopItemTarget = "self_team" | "enemy_team" | "enemy_player";
export type ShopItemDurationType = "round" | "charges" | "seconds" | "instant";

export const DEBUFF_EFFECT_IDS: ReadonlySet<EffectItemId> = new Set([
	"ENEMY_SKIP_PENALTY",
	"FREEZE_NEXT_WORD",
	"VOICE_MUTE",
	"FLIP_WORD",
]);

export interface ShopCatalogItem {
	readonly id: EffectItemId;
	readonly name: string;
	readonly description: string;
	readonly price: number;
	readonly target: ShopItemTarget;
	readonly durationType: ShopItemDurationType;
	readonly charges?: number;
	readonly durationSeconds?: number;
	readonly requiresSetting?: "isVoiceChatEnabled";
}

export const MAX_INVENTORY_SIZE = 3;

export const SHOP_CATALOG: readonly ShopCatalogItem[] = Object.freeze([
	{
		id: "DOUBLE_POINTS",
		name: "×2 Очки",
		description:
			"Удваивает очки за угаданные слова в текущем/следующем раунде своей команды",
		price: 10,
		target: "self_team",
		durationType: "round",
	},
	{
		id: "ENEMY_SKIP_PENALTY",
		name: "-2 за пропуск",
		description:
			"Штрафует команду соперника на −2 очка за каждый пропуск слова",
		price: 8,
		target: "enemy_team",
		durationType: "round",
	},
	{
		id: "FREE_SKIP_SHIELD",
		name: "Бесплатный пропуск",
		description: "Обнуляет штраф за 1 пропуск слова своей команды",
		price: 6,
		target: "self_team",
		durationType: "charges",
		charges: 1,
	},
	{
		id: "FREEZE_NEXT_WORD",
		name: "Заморозка кнопки",
		description:
			"Блокирует переключение следующего слова игроку соперника на 5 секунд",
		price: 12,
		target: "enemy_player",
		durationType: "seconds",
		durationSeconds: 5,
	},
	{
		id: "VOICE_MUTE",
		name: "Голосовой мут",
		description: "Отключает микрофон игроку соперника на 5 секунд",
		price: 15,
		target: "enemy_player",
		durationType: "seconds",
		durationSeconds: 5,
		requiresSetting: "isVoiceChatEnabled",
	},
	{
		id: "CLEANSE",
		name: "Антидот",
		description:
			"Снимает все активные негативные эффекты со своей команды и её игроков",
		price: 10,
		target: "self_team",
		durationType: "instant",
	},
	{
		id: "EXTRA_TIME",
		name: "+10 секунд",
		description:
			"Добавляет 10 секунд к таймеру текущего раунда своей команды",
		price: 12,
		target: "self_team",
		durationType: "instant",
	},
	{
		id: "TIME_DRAIN",
		name: "-5 секунд",
		description:
			"Отнимает 5 секунд от таймера текущего раунда команды соперника",
		price: 12,
		target: "enemy_team",
		durationType: "instant",
	},
	{
		id: "FLIP_WORD",
		name: "Перевёртыш",
		description:
			"Переворачивает слово на экране объясняющего соперника на 8 секунд",
		price: 10,
		target: "enemy_player",
		durationType: "seconds",
		durationSeconds: 8,
	},
	{
		id: "REROLL_WORD",
		name: "Замена слова",
		description:
			"Меняет текущее слово на новое из словаря без штрафа и без записи в пропуск",
		price: 8,
		target: "self_team",
		durationType: "instant",
	},
]);

export interface ShopInventoryItem {
	readonly id: string;
	readonly itemId: EffectItemId;
	readonly purchasedAt: number;
}

export interface ShopSlice {
	readonly inventories: Record<string, ShopInventoryItem[]>;
}

export class ShopDisabledError extends GameError {
	constructor() {
		super("Shop is disabled in this room", GameErrorCode.SHOP_DISABLED);
		this.name = "ShopDisabledError";
	}
}

export class ShopItemNotFoundError extends GameError {
	constructor(itemId: string) {
		super(
			`Shop item '${itemId}' was not found in catalog`,
			GameErrorCode.SHOP_ITEM_NOT_FOUND,
			{ itemId },
		);
		this.name = "ShopItemNotFoundError";
	}
}

export class ShopItemDisabledError extends GameError {
	constructor(itemId: string, setting: string) {
		super(
			`Shop item '${itemId}' is disabled because setting '${setting}' is off`,
			GameErrorCode.SHOP_ITEM_DISABLED,
			{ itemId, setting },
		);
		this.name = "ShopItemDisabledError";
	}
}

export class InventoryFullError extends GameError {
	constructor(playerId: string, max: number) {
		super(
			`Player '${playerId}' inventory is full (maximum ${max} items)`,
			GameErrorCode.INVENTORY_FULL,
			{ playerId, max },
		);
		this.name = "InventoryFullError";
	}
}

export class ItemNotInInventoryError extends GameError {
	constructor(inventoryItemId: string) {
		super(
			`Item '${inventoryItemId}' is not in player inventory`,
			GameErrorCode.ITEM_NOT_IN_INVENTORY,
			{ inventoryItemId },
		);
		this.name = "ItemNotInInventoryError";
	}
}

export class InvalidEffectTargetError extends GameError {
	constructor(reason: string) {
		super(
			`Invalid effect target: ${reason}`,
			GameErrorCode.INVALID_EFFECT_TARGET,
			{ reason },
		);
		this.name = "InvalidEffectTargetError";
	}
}

export class EffectAlreadyActiveError extends GameError {
	constructor(itemId: string, targetId: string) {
		super(
			`Effect '${itemId}' is already active or armed on target '${targetId}'`,
			GameErrorCode.EFFECT_ALREADY_ACTIVE,
			{ itemId, targetId },
		);
		this.name = "EffectAlreadyActiveError";
	}
}
