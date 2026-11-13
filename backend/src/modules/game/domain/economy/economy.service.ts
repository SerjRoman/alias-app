import { v4 as uuidv4 } from "uuid";
import type { GameState } from "../state/game.state";
import {
	InsufficientFundsError,
	InvalidEconomyAmountError,
	type EconomySlice,
} from "./economy.types";

/**
 * Pure domain service for player coin balance management and transaction auditing.
 * Completely decoupled from Shop, Bets, or Round logic.
 */
export class EconomyService {
	public static readonly ADDON_KEY = "economy";

	/**
	 * Retrieves or initializes the isolated economy slice from GameState addons.
	 */
	public static getSlice(state: GameState): EconomySlice {
		state.addons ??= {};
		if (!state.addons.economy) {
			state.addons.economy = {
				wallets: {},
				ledger: [],
			};
		}
		return state.addons.economy;
	}

	/**
	 * Returns current coin balance of a player (defaults to 0).
	 */
	public static getBalance(state: GameState, playerId: string): number {
		const slice = this.getSlice(state);
		return slice.wallets[playerId] ?? 0;
	}

	/**
	 * Deposits positive amount of coins into player's wallet and records audit ledger entry.
	 */
	public static deposit(
		state: GameState,
		playerId: string,
		amount: number,
		reason: string,
		now: number = Date.now(),
	): void {
		if (amount <= 0) {
			throw new InvalidEconomyAmountError(amount);
		}

		const slice = this.getSlice(state);
		const currentBalance = slice.wallets[playerId] ?? 0;
		const balanceAfter = currentBalance + amount;

		slice.wallets[playerId] = balanceAfter;
		slice.ledger.push({
			id: uuidv4(),
			playerId,
			delta: amount,
			balanceAfter,
			reason,
			timestamp: now,
		});
	}

	/**
	 * Withdraws positive amount of coins from player's wallet and records audit ledger entry.
	 * Throws InsufficientFundsError if current balance is lower than amount.
	 */
	public static withdraw(
		state: GameState,
		playerId: string,
		amount: number,
		reason: string,
		now: number = Date.now(),
	): void {
		if (amount <= 0) {
			throw new InvalidEconomyAmountError(amount);
		}

		const slice = this.getSlice(state);
		const currentBalance = slice.wallets[playerId] ?? 0;

		if (currentBalance < amount) {
			throw new InsufficientFundsError(playerId, amount, currentBalance);
		}

		const balanceAfter = currentBalance - amount;
		slice.wallets[playerId] = balanceAfter;
		slice.ledger.push({
			id: uuidv4(),
			playerId,
			delta: -amount,
			balanceAfter,
			reason,
			timestamp: now,
		});
	}

	/**
	 * Atomically transfers coins between two players.
	 */
	public static transfer(
		state: GameState,
		fromPlayerId: string,
		toPlayerId: string,
		amount: number,
		reason: string,
		now: number = Date.now(),
	): void {
		// Validates balance and withdraws from sender (throws if insufficient)
		this.withdraw(state, fromPlayerId, amount, reason, now);
		// Deposits into recipient
		this.deposit(state, toPlayerId, amount, reason, now);
	}
}
