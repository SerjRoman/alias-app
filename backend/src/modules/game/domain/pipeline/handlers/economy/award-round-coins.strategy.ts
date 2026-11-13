import type { ActionStrategy } from "../../../dispatcher/action-dispatcher";
import type { EndPointingAction } from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";
import {
	EconomyService,
	type EconomyRewardsConfig,
	DEFAULT_ECONOMY_CONFIG,
} from "../../../economy";

/**
 * Strategy executed on END_POINTING to award coins to the active team's
 * explainer and guessers based on the number of successfully guessed words in the round.
 */
export class AwardRoundCoinsStrategy implements ActionStrategy<EndPointingAction> {
	readonly actionType = "END_POINTING" as const;

	constructor(
		private readonly config: EconomyRewardsConfig = DEFAULT_ECONOMY_CONFIG,
	) {}

	handle(_action: EndPointingAction, ctx: ActionContext): void {
		const { state, now } = ctx;
		if (state.settings?.isShopEnabled === false) {
			return;
		}

		const round = state.currentRound;
		if (!round || !round.words || round.words.length === 0) {
			return;
		}

		const guessedCount = round.words.filter(
			(w) => w.outcome === "guessed",
		).length;
		if (guessedCount <= 0) {
			return;
		}

		const timestamp = now ?? Date.now();

		// Award coins to designated explainer
		if (round.explainerId && this.config.coinsPerGuessedWordExplainer > 0) {
			const explainerAmount =
				guessedCount * this.config.coinsPerGuessedWordExplainer;
			EconomyService.deposit(
				state,
				round.explainerId,
				explainerAmount,
				"round_guessed_words",
				timestamp,
			);
		}

		// Award coins to guessers in the active round's team
		if (this.config.coinsPerGuessedWordGuesser > 0) {
			const activeTeam = state.teams.find((t) => t.id === round.teamId);
			const guesserIds =
				activeTeam?.playerIds?.filter(
					(id) => id !== round.explainerId,
				) ?? [];

			const guesserAmount =
				guessedCount * this.config.coinsPerGuessedWordGuesser;

			for (const guesserId of guesserIds) {
				EconomyService.deposit(
					state,
					guesserId,
					guesserAmount,
					"round_guessed_words",
					timestamp,
				);
			}
		}
	}
}
