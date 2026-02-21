import { create } from "zustand";
import type {
	TeamState,
	PlayerState,
	GameStateDetails,
	GameSettings,
} from "./game.types";

export interface GameSliceState {
	game: GameStateDetails | null;
	setGameState: (newGame: GameStateDetails) => void;
	updateTeams: (newTeams: TeamState[]) => void;
	updatePlayer: (updatedPlayer: PlayerState) => void;
	updatePlayers: (updatedPlayers: PlayerState[]) => void;
	updateSettings: (settings: GameSettings) => void;
	clearGame: () => void;
}

export const useGameSlice = create<GameSliceState>((set) => ({
	game: null,

	setGameState: (newGameState: GameStateDetails) =>
		set({ game: newGameState }),

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
	updateSettings: (newSettings) =>
		set((state) => {
			if (!state.game) return {};
			return {
				game: {
					...state.game,
					settings: newSettings,
				},
			};
		}),
}));
