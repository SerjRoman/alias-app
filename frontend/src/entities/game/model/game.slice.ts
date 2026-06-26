import { create } from "zustand";
import type {
	TeamState,
	PlayerState,
	GameStateDetails,
	GameStateUpdatePayload,
	GameSettings,
	RoundState,
	WordState,
} from "./game.types";

export interface GameSliceState {
	game: GameStateDetails | null;
	currentWord: WordState | null;
	setCurrentWord: (newWord: WordState) => void;
	resetCurrentWord: () => void;
	setGameState: (newGame: GameStateDetails | GameStateUpdatePayload) => void;
	updateTeams: (newTeams: TeamState[]) => void;
	updatePlayer: (updatedPlayer: PlayerState) => void;
	updatePlayers: (updatedPlayers: PlayerState[]) => void;
	updateGameSettings: (settings: GameSettings) => void;
	updateRound: (updatedRound: RoundState) => void;
	clearGame: () => void;
}

export const useGameSlice = create<GameSliceState>((set) => ({
	game: null,
	currentWord: null,
	setGameState: (newGameState: GameStateDetails | GameStateUpdatePayload) =>
		set((state) => {
			const mergedSettings =
				newGameState.settings ?? state.game?.settings;
			return {
				game: mergedSettings
					? { ...newGameState, settings: mergedSettings }
					: (newGameState as GameStateDetails),
			};
		}),
	setCurrentWord: (newWord: WordState) =>
		set((state) => ({ ...state, currentWord: newWord })),
	resetCurrentWord: () => set({ currentWord: null }),
	updateTeams: (newTeams: TeamState[]) =>
		set((state) => {
			if (!state.game) {
				return {};
			}
			return {
				game: {
					...state.game,
					teams: newTeams,
				},
			};
		}),
	updatePlayers: (players: PlayerState[]) =>
		set((state) => {
			if (!state.game) return {};
			return {
				game: {
					...state.game,
					players: players,
				},
			};
		}),
	updatePlayer: (updatedPlayer: PlayerState) =>
		set((state) => {
			if (!state.game) return {};

			return {
				game: {
					...state.game,
					players: state.game.players.map((player) =>
						player.id === updatedPlayer.id ? updatedPlayer : player,
					),
				},
			};
		}),

	clearGame: () => set({ game: null }),
	updateGameSettings: (newSettings) =>
		set((state) => {
			if (!state.game) return {};
			return {
				game: {
					...state.game,
					settings: newSettings,
				},
			};
		}),
	updateRound: (updatedRound) =>
		set((state) => {
			if (!state.game) return {};
			return {
				game: {
					...state.game,
					currentRound: updatedRound,
				},
			};
		}),
}));
