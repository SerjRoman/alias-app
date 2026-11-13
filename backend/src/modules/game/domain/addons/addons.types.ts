import type { EconomySlice } from "../economy/economy.types";
import type { ShopSlice } from "../shop/shop.types";

/**
 * Registry of first-party and plugin addon slices attached to a GameState.
 * Core slices (economy, shop) are strongly typed; custom/community
 * addons can be added via the index signature or TypeScript interface declaration merging.
 */
export interface GameAddons {
	economy?: EconomySlice;
	shop?: ShopSlice;
	[addonKey: string]: unknown;
}

/**
 * Standard string constants for canonical addon slice keys.
 */
export const ADDON_KEYS = {
	ECONOMY: "economy",
	SHOP: "shop",
} as const;

export type AddonKey =
	| (typeof ADDON_KEYS)[keyof typeof ADDON_KEYS]
	| (string & {});

/**
 * Type guard to check if a specific addon slice exists and is initialized on GameState.
 */
export function hasAddon<K extends keyof GameAddons>(
	addons: GameAddons | undefined,
	key: K,
): addons is GameAddons & Record<K, NonNullable<GameAddons[K]>> {
	return Boolean(addons && addons[key] !== undefined && addons[key] !== null);
}
