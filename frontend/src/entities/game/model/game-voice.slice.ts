import { create } from "zustand";

interface GameVoiceState {
	voiceToken: string | null;
	setVoiceToken: (voiceToken: string) => void;
	clearVoiceToken: () => void;
}

export const useGameVoice = create<GameVoiceState>()(
	(set) => ({
		voiceToken: null,
		setVoiceToken: (voiceToken: string) => set({ voiceToken }),
		clearVoiceToken: () => set({ voiceToken: null }),
	}),
);
