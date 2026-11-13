import { create } from "zustand/react";

export type EffectItemId =
	| "DOUBLE_POINTS"
	| "ENEMY_SKIP_PENALTY"
	| "FREE_SKIP_SHIELD"
	| "FREEZE_NEXT_WORD"
	| "VOICE_MUTE";

export type EffectTargetType = "self_team" | "enemy_team" | "enemy_player";

export interface PendingTargetItem {
	inventoryItemId: string;
	itemId: EffectItemId;
	itemName: string;
	target: EffectTargetType;
}

export interface ShopInventoryItem {
	id: string;

	itemId: EffectItemId;

	purchasedAt: number;
}
export interface PrivatePlayerState {
	balance: number;
	inventory: ShopInventoryItem[];
}

export interface PrivatePlayerSliceState extends PrivatePlayerState {
	pendingTargetItem: PendingTargetItem | null;
	setBalance: (balance: number) => void;
	setInventory: (inventory: ShopInventoryItem[]) => void;
	setPlayerState: (state: PrivatePlayerState) => void;
	setPendingTargetItem: (item: PendingTargetItem | null) => void;
	resetPlayerState: () => void;
}

const initialPlayerState: PrivatePlayerState = {
	balance: 0,
	inventory: [],
};

export const usePrivatePlayerSlice = create<PrivatePlayerSliceState>((set) => ({
	...initialPlayerState,
	pendingTargetItem: null,
	setBalance: (balance: number) => set({ balance }),
	setInventory: (inventory: ShopInventoryItem[]) => set({ inventory }),
	setPlayerState: (state: PrivatePlayerState) => set({ ...state }),
	setPendingTargetItem: (pendingTargetItem: PendingTargetItem | null) =>
		set({ pendingTargetItem }),
	resetPlayerState: () =>
		set({ ...initialPlayerState, pendingTargetItem: null }),
}));
