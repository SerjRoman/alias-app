import { GameError } from "../errors/game.errors";
import { GameErrorCode } from "../errors/error-codes";

/**
 * A single financial transaction record in the domain audit ledger.
 */
export interface LedgerRecord {
	id: string;
	playerId: string;
	delta: number;
	balanceAfter: number;
	reason: string;
	timestamp: number;
}

/**
 * Isolated state slice stored in `state.addons['economy']`.
 */
export interface EconomySlice {
	/** Balance per playerId (e.g. { "user-1": 150 }) */
	wallets: Record<string, number>;
	/** Complete audit history of coin movements */
	ledger: LedgerRecord[];
}

export interface EconomyRewardsConfig {
	readonly coinsPerGuessedWordExplainer: number;
	readonly coinsPerGuessedWordGuesser: number;
}

export const DEFAULT_ECONOMY_CONFIG: EconomyRewardsConfig = {
	coinsPerGuessedWordExplainer: 2,
	coinsPerGuessedWordGuesser: 1,
};

export class InsufficientFundsError extends GameError {
	constructor(playerId: string, required: number, actual: number) {
		super(
			`Player ${playerId} has insufficient coins: needs ${required}, has ${actual}`,
			GameErrorCode.INSUFFICIENT_FUNDS,
			{ playerId, required, actual },
		);
		this.name = "InsufficientFundsError";
	}
}

export class InvalidEconomyAmountError extends GameError {
	constructor(amount: number) {
		super(
			`Economy transaction amount must be positive, got: ${amount}`,
			GameErrorCode.INVALID_ECONOMY_AMOUNT,
			{ amount },
		);
		this.name = "InvalidEconomyAmountError";
	}
}
