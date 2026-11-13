import { create } from "zustand";

interface GameVoiceState {
	voiceToken: string | null;
	isDeafened: boolean;
	isKrispEnabled: boolean;
	speakerVolume: number;
	micVolume: number;
	activeSpeakerIds: string[];
	setVoiceToken: (voiceToken: string) => void;
	clearVoiceToken: () => void;
	setIsDeafened: (isDeafened: boolean) => void;
	toggleDeafened: () => void;
	setIsKrispEnabled: (isKrispEnabled: boolean) => void;
	setSpeakerVolume: (volume: number) => void;
	setMicVolume: (volume: number) => void;
	setActiveSpeakerIds: (ids: string[]) => void;
}

export const useGameVoice = create<GameVoiceState>()((set) => ({
	voiceToken: null,
	isDeafened: false,
	isKrispEnabled: false,
	speakerVolume: 1,
	micVolume: 1,
	activeSpeakerIds: [],
	setVoiceToken: (voiceToken: string) => set({ voiceToken }),
	clearVoiceToken: () => set({ voiceToken: null, activeSpeakerIds: [] }),
	setIsDeafened: (isDeafened: boolean) => set({ isDeafened }),
	toggleDeafened: () =>
		set((state) => ({ isDeafened: !state.isDeafened })),
	setIsKrispEnabled: (isKrispEnabled: boolean) => set({ isKrispEnabled }),
	setSpeakerVolume: (speakerVolume: number) =>
		set({ speakerVolume: Math.max(0, Math.min(1, speakerVolume)) }),
	setMicVolume: (micVolume: number) =>
		set({ micVolume: Math.max(0, Math.min(2, micVolume)) }),
	setActiveSpeakerIds: (activeSpeakerIds: string[]) =>
		set({ activeSpeakerIds }),
}));
