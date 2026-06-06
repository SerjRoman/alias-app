import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserSettingsStore {
	isAssistantDisabled: boolean;
	setAssistantDisabled: (disabled: boolean) => void;
}

export const useUserSettings = create<UserSettingsStore>()(
	persist(
		(set) => ({
			isAssistantDisabled: false,
			setAssistantDisabled: (disabled: boolean) => set({ isAssistantDisabled: disabled }),
		}),
		{
			name: "user-settings",
		},
	),
);
