import { EconomyService } from "./economy.service";
import {
	InsufficientFundsError,
	InvalidEconomyAmountError,
} from "./economy.types";
import type { GameState } from "../state/game.state";

describe("EconomyService", () => {
	const createMockState = (): { addons: Record<string, unknown> } => ({
		addons: {},
	});

	it("returns 0 balance for a player with no wallet yet", () => {
		const state = createMockState();
		const balance = EconomyService.getBalance(
			state as GameState,
			"player-1",
		);
		expect(balance).toBe(0);
	});

	it("deposits coins, updates balance, and appends a ledger record", () => {
		const state = createMockState();
		const now = 1_000_000;

		EconomyService.deposit(
			state as GameState,
			"player-1",
			100,
			"ROUND_REWARD",
			now,
		);

		expect(EconomyService.getBalance(state as GameState, "player-1")).toBe(
			100,
		);

		const slice = EconomyService.getSlice(state as GameState);
		expect(slice.ledger).toHaveLength(1);
		expect(slice.ledger[0]).toEqual({
			id: expect.any(String),
			playerId: "player-1",
			delta: 100,
			balanceAfter: 100,
			reason: "ROUND_REWARD",
			timestamp: now,
		});
	});

	it("throws InvalidEconomyAmountError if deposit amount is zero or negative", () => {
		const state = createMockState();

		expect(() =>
			EconomyService.deposit(state as GameState, "player-1", 0, "TEST"),
		).toThrow(InvalidEconomyAmountError);

		expect(() =>
			EconomyService.deposit(state as GameState, "player-1", -10, "TEST"),
		).toThrow(InvalidEconomyAmountError);
	});

	it("withdraws coins, updates balance, and appends a ledger record with negative delta", () => {
		const state = createMockState();
		EconomyService.deposit(
			state as GameState,
			"player-1",
			100,
			"START_BALANCE",
		);

		EconomyService.withdraw(
			state as GameState,
			"player-1",
			40,
			"SHOP_BUY:FREEZE",
			2_000_000,
		);

		expect(EconomyService.getBalance(state as GameState, "player-1")).toBe(
			60,
		);

		const slice = EconomyService.getSlice(state as GameState);
		expect(slice.ledger).toHaveLength(2);
		expect(slice.ledger[1]).toEqual({
			id: expect.any(String),
			playerId: "player-1",
			delta: -40,
			balanceAfter: 60,
			reason: "SHOP_BUY:FREEZE",
			timestamp: 2_000_000,
		});
	});

	it("throws InsufficientFundsError if withdrawal exceeds player balance and leaves state intact", () => {
		const state = createMockState();
		EconomyService.deposit(
			state as GameState,
			"player-1",
			30,
			"START_BALANCE",
		);

		expect(() =>
			EconomyService.withdraw(
				state as GameState,
				"player-1",
				50,
				"EXPENSIVE_ITEM",
			),
		).toThrow(InsufficientFundsError);

		expect(EconomyService.getBalance(state as GameState, "player-1")).toBe(
			30,
		);
		expect(EconomyService.getSlice(state as GameState).ledger).toHaveLength(
			1,
		);
	});

	it("throws InvalidEconomyAmountError if withdrawal amount is zero or negative", () => {
		const state = createMockState();
		EconomyService.deposit(state as GameState, "player-1", 100, "START");

		expect(() =>
			EconomyService.withdraw(
				state as GameState,
				"player-1",
				0,
				"INVALID",
			),
		).toThrow(InvalidEconomyAmountError);

		expect(() =>
			EconomyService.withdraw(
				state as GameState,
				"player-1",
				-5,
				"INVALID",
			),
		).toThrow(InvalidEconomyAmountError);
	});

	it("transfers coins atomically between two players", () => {
		const state = createMockState();
		EconomyService.deposit(state as GameState, "alice", 100, "START");

		EconomyService.transfer(
			state as GameState,
			"alice",
			"bob",
			40,
			"BET_PAYOUT",
			3_000_000,
		);

		expect(EconomyService.getBalance(state as GameState, "alice")).toBe(60);
		expect(EconomyService.getBalance(state as GameState, "bob")).toBe(40);

		const slice = EconomyService.getSlice(state as GameState);
		// 1 deposit + 1 sender withdraw + 1 receiver deposit = 3 ledger entries
		expect(slice.ledger).toHaveLength(3);
		expect(slice.ledger[1].delta).toBe(-40);
		expect(slice.ledger[1].playerId).toBe("alice");
		expect(slice.ledger[2].delta).toBe(40);
		expect(slice.ledger[2].playerId).toBe("bob");
	});

	it("fails transfer and rolls back if sender has insufficient funds", () => {
		const state = createMockState();
		EconomyService.deposit(state as GameState, "alice", 20, "START");

		expect(() =>
			EconomyService.transfer(
				state as GameState,
				"alice",
				"bob",
				50,
				"BET_PAYOUT",
			),
		).toThrow(InsufficientFundsError);

		expect(EconomyService.getBalance(state as GameState, "alice")).toBe(20);
		expect(EconomyService.getBalance(state as GameState, "bob")).toBe(0);
	});
});
