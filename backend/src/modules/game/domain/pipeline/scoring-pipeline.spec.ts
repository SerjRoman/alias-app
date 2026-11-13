import { GameEngine } from "../engine/game-engine";
import { ActionBlockedByEffectError } from "../errors/game.errors";
import { RoundStatus } from "../state/game.state";
import { calculateWordScore, type ActiveEffect } from "./scoring-pipeline";

let idCounter = 0;
jest.mock("uuid", () => ({
	v4: () => `scoring-uuid-${++idCounter}`,
}));

describe("Staged Scoring Pipeline, Effect Snapshots & Command Guards", () => {
	const roomId = "room-scoring";
	const ownerId = "p-red-1";
	const bluePlayerId = "p-blue-1";

	const createInProgressEngine = () => {
		return GameEngine.fromPrimitives({
			id: roomId,
			ownerId,
			status: "IN_PROGRESS",
			pointsToWin: 30,
			teams: [
				{
					id: "team-red",
					name: "Red",
					color: "#FF0000",
					score: 10,
					playerIds: [ownerId],
				},
				{
					id: "team-blue",
					name: "Blue",
					color: "#0000FF",
					score: 10,
					playerIds: [bluePlayerId],
				},
			],
			players: [
				{
					id: ownerId,
					name: "Alice",
					teamId: "team-red",
					isReady: true,
					score: 0,
				},
				{
					id: bluePlayerId,
					name: "Bob",
					teamId: "team-blue",
					isReady: true,
					score: 0,
				},
			],
			bannedPlayerIds: [],
			activeTeamId: "team-red",
			currentRound: {
				id: "round-1",
				explainerId: ownerId,
				teamId: "team-red",
				status: RoundStatus.IN_PROGRESS,
				currentWord: {
					id: "word-1",
					text: "CAT",
					score: 0,
					outcome: "neutral",
					appliedEffectIds: [],
				},
				words: [],
				roundNumber: 1,
				expiresAt: Date.now() + 60000,
			},
			activeEffects: [],
			addons: {},
		});
	};

	describe("1. Pure Staged Scoring Function (calculateWordScore)", () => {
		it("evaluates stages in deterministic order: base -> additive -> multiplicative -> override", () => {
			const effects: ActiveEffect[] = [
				{
					id: "eff-skip-penalty",
					itemId: "ENEMY_SKIP_PENALTY",
					sourcePlayerId: bluePlayerId,
					targetTeamId: "team-red",
					status: "ACTIVE" as const,
				},
				{
					id: "eff-double",
					itemId: "DOUBLE_POINTS",
					sourcePlayerId: ownerId,
					targetTeamId: "team-red",
					status: "ACTIVE" as const,
				},
				{
					id: "eff-shield",
					itemId: "FREE_SKIP_SHIELD",
					sourcePlayerId: ownerId,
					targetTeamId: "team-red",
					status: "ACTIVE" as const,
					charges: 1,
				},
			];

			const guessedResult = calculateWordScore(
				"guessed",
				["eff-double", "eff-skip-penalty"],
				effects,
			);
			expect(guessedResult.score).toBe(2);
			expect(guessedResult.consumedEffectIds).toEqual([]);

			const skippedPenaltyResult = calculateWordScore(
				"skipped",
				["eff-skip-penalty"],
				effects,
			);
			expect(skippedPenaltyResult.score).toBe(-2);

			const shieldedResult = calculateWordScore(
				"skipped",
				["eff-skip-penalty", "eff-shield"],
				effects,
			);
			expect(shieldedResult.score).toBe(0);
			expect(shieldedResult.consumedEffectIds).toEqual(["eff-shield"]);
		});
	});

	describe("2. Forward-Only Effect Snapshots & Pointing Review Recalculation", () => {
		it("applies mid-round effects only to words played AFTER activation and preserves modifiers during POINTING review", () => {
			const engine = createInProgressEngine();

			engine.dispatch({
				type: "WORD_SKIPPED",
				actorId: ownerId,
				payload: { nextWordText: "DOG" },
			});
			expect(engine.getState().teams[0].score).toBe(9);
			expect(engine.getState().currentRound?.words[0].score).toBe(-1);
			expect(
				engine.getState().currentRound?.words[0].appliedEffectIds,
			).toEqual([]);

			engine.getState().activeEffects = [
				{
					id: "eff-enemy-skip",
					itemId: "ENEMY_SKIP_PENALTY",
					sourcePlayerId: bluePlayerId,
					targetTeamId: "team-red",
					status: "ACTIVE",
				},
				{
					id: "eff-double-pts",
					itemId: "DOUBLE_POINTS",
					sourcePlayerId: ownerId,
					targetTeamId: "team-red",
					status: "ACTIVE",
				},
			];

			engine.dispatch({
				type: "WORD_SKIPPED",
				actorId: ownerId,
				payload: { nextWordText: "BIRD" },
			});
			expect(engine.getState().teams[0].score).toBe(7);
			expect(engine.getState().currentRound?.words[1].score).toBe(-2);
			expect(
				engine.getState().currentRound?.words[1].appliedEffectIds,
			).toEqual(["eff-enemy-skip", "eff-double-pts"]);
			expect(engine.getState().currentRound?.words[0].score).toBe(-1);

			engine.dispatch({
				type: "WORD_GUESSED",
				actorId: ownerId,
				payload: { nextWordText: "FISH" },
			});
			expect(engine.getState().teams[0].score).toBe(9);
			expect(engine.getState().currentRound?.words[2].score).toBe(2);

			engine.dispatch({
				type: "START_POINTING",
				actorId: ownerId,
			});

			const words = engine.getState().currentRound!.words;
			const dogWord = words[1];
			const birdWord = words[2];

			engine.dispatch({
				type: "CHANGE_WORD_SCORE",
				actorId: ownerId,
				payload: { wordId: dogWord.id, delta: 1 },
			});
			expect(dogWord.outcome).toBe("neutral");
			expect(dogWord.score).toBe(0);
			expect(engine.getState().teams[0].score).toBe(11);

			engine.dispatch({
				type: "CHANGE_WORD_SCORE",
				actorId: ownerId,
				payload: { wordId: dogWord.id, delta: 1 },
			});
			expect(dogWord.outcome).toBe("guessed");
			expect(dogWord.score).toBe(2);
			expect(engine.getState().teams[0].score).toBe(13);

			engine.dispatch({
				type: "CHANGE_WORD_SCORE",
				actorId: ownerId,
				payload: { wordId: birdWord.id, delta: -1 },
			});
			expect(birdWord.outcome).toBe("neutral");
			expect(birdWord.score).toBe(0);
			expect(engine.getState().teams[0].score).toBe(11);

			engine.dispatch({
				type: "END_POINTING",
				actorId: ownerId,
			});
			expect(
				engine
					.getState()
					.activeEffects?.every((e) => e.status === "CONSUMED"),
			).toBe(true);
		});

		it("consumes FREE_SKIP_SHIELD charge on first skipped word and applies normal penalty on second skipped word", () => {
			const engine = createInProgressEngine();
			engine.getState().activeEffects = [
				{
					id: "eff-shield-1",
					itemId: "FREE_SKIP_SHIELD",
					sourcePlayerId: ownerId,
					targetTeamId: "team-red",
					status: "ACTIVE",
					charges: 1,
				},
			];

			engine.dispatch({
				type: "WORD_SKIPPED",
				actorId: ownerId,
				payload: { nextWordText: "DOG" },
			});
			expect(engine.getState().currentRound?.words[0].score).toBe(0);
			expect(engine.getState().teams[0].score).toBe(10);
			expect(engine.getState().activeEffects).toHaveLength(0);

			engine.dispatch({
				type: "WORD_SKIPPED",
				actorId: ownerId,
				payload: { nextWordText: "BIRD" },
			});
			expect(engine.getState().currentRound?.words[1].score).toBe(-1);
			expect(engine.getState().teams[0].score).toBe(9);
		});
	});

	describe("3. ARMED -> ACTIVE Transition on START_ROUND & Command Guards (FREEZE_NEXT_WORD)", () => {
		it("activates ARMED round effects when target team starts its round", () => {
			const engine = createInProgressEngine();
			const round = engine.getState().currentRound!;
			round.status = RoundStatus.PENDING;
			round.currentWord = null;

			engine.getState().activeEffects = [
				{
					id: "eff-armed-double",
					itemId: "DOUBLE_POINTS",
					sourcePlayerId: ownerId,
					targetTeamId: "team-red",
					status: "ARMED",
				},
			];

			engine.dispatch({
				type: "START_ROUND",
				actorId: ownerId,
				payload: { durationSeconds: 60, firstWordText: "LION" },
			});

			expect(engine.getState().activeEffects?.[0].status).toBe("ACTIVE");

			engine.dispatch({
				type: "WORD_GUESSED",
				actorId: ownerId,
				payload: { nextWordText: "TIGER" },
			});
			expect(engine.getState().currentRound?.words[0].score).toBe(2);
			expect(engine.getState().teams[0].score).toBe(12);
		});

		it("blocks WORD_GUESSED and WORD_SKIPPED with ActionBlockedByEffectError while FREEZE_NEXT_WORD is active and unblocks after expiresAt", () => {
			const engine = createInProgressEngine();
			const now = 1_000_000;

			engine.getState().activeEffects = [
				{
					id: "eff-freeze",
					itemId: "FREEZE_NEXT_WORD",
					sourcePlayerId: bluePlayerId,
					targetPlayerId: ownerId,
					status: "ACTIVE",
					expiresAt: now + 5000,
				},
			];

			expect(() =>
				engine.dispatch(
					{
						type: "WORD_GUESSED",
						actorId: ownerId,
						payload: { nextWordText: "DOG" },
					},
					now + 2000,
				),
			).toThrow(ActionBlockedByEffectError);

			expect(() =>
				engine.dispatch(
					{
						type: "WORD_SKIPPED",
						actorId: ownerId,
						payload: { nextWordText: "DOG" },
					},
					now + 4999,
				),
			).toThrow(ActionBlockedByEffectError);

			expect(engine.getState().currentRound?.words).toHaveLength(0);
			expect(engine.getState().currentRound?.currentWord?.text).toBe(
				"CAT",
			);

			engine.dispatch(
				{
					type: "WORD_GUESSED",
					actorId: ownerId,
					payload: { nextWordText: "DOG" },
				},
				now + 5000,
			);

			expect(engine.getState().activeEffects).toHaveLength(0);
			expect(engine.getState().currentRound?.words).toHaveLength(1);
			expect(engine.getState().teams[0].score).toBe(11);
		});
	});
});
