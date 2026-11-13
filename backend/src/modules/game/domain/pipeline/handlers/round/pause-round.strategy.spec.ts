import {
	PauseRoundStrategy,
	ResumeRoundStrategy,
} from "./round-pause.strategies";
import { RoundStatus, type GameState } from "../../../state/game.state";
import type {
	PauseGameAction,
	ResumeGameAction,
} from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";

describe("PauseRoundStrategy & ResumeRoundStrategy", () => {
	const createMockState = (): GameState => ({
		id: "room-1",
		ownerId: "user-1",
		status: "IN_PROGRESS",
		pointsToWin: 30,
		teams: [],
		players: [],
		bannedPlayerIds: [],
		activeTeamId: "team-1",
		currentRound: {
			id: "r-1",
			teamId: "team-1",
			explainerId: "user-1",
			status: RoundStatus.IN_PROGRESS,
			roundNumber: 1,
			expiresAt: 10_000,
			words: [],
			currentWord: null,
		},
		activeEffects: [],
		addons: {},
	});

	it("pauses active round using pauseTimer", () => {
		const strategy = new PauseRoundStrategy();
		const state = createMockState();
		const action: PauseGameAction = { type: "PAUSE_GAME" };
		const ctx: ActionContext = {
			action,
			state,
			emit: jest.fn(),
			now: 4_000,
		};

		strategy.handle(action, ctx);

		expect(state.currentRound?.pausedAt).toBe(4_000);
		expect(state.currentRound?.remainingMs).toBe(6_000);
	});

	it("resumes paused round using resumeTimer", () => {
		const pauseStrat = new PauseRoundStrategy();
		const resumeStrat = new ResumeRoundStrategy();
		const state = createMockState();
		const pauseCtx: ActionContext = {
			action: { type: "PAUSE_GAME" },
			state,
			emit: jest.fn(),
			now: 4_000,
		};
		pauseStrat.handle(pauseCtx.action as PauseGameAction, pauseCtx);

		const resumeCtx: ActionContext = {
			action: { type: "RESUME_GAME" },
			state,
			emit: jest.fn(),
			now: 8_000,
		};
		resumeStrat.handle(resumeCtx.action as ResumeGameAction, resumeCtx);

		expect(state.currentRound?.expiresAt).toBe(14_000); // 8_000 + 6_000
		expect(state.currentRound?.pausedAt).toBeNull();
		expect(state.currentRound?.remainingMs).toBeNull();
	});
});
