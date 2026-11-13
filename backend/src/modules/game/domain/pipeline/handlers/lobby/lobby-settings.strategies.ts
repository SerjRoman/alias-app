import type { ActionStrategy } from "../../../dispatcher/action-dispatcher";
import type {
	TransferOwnershipAction,
	UpdateSettingsAction,
	SubmitCustomWordsAction,
} from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";
import { OWNER_OFFLINE_TIMEOUT_MS } from "../../../state/game.state";
import {
	GameNotInLobbyError,
	HatModeDisabledError,
	InvalidSubmittedWordsCountError,
	PlayerNotFoundError,
	PlayerNotRoomOwnerError,
	WordsPerPlayerNotConfiguredError,
} from "../../../errors/game.errors";

export class TransferOwnershipStrategy implements ActionStrategy<TransferOwnershipAction> {
	readonly actionType = "TRANSFER_OWNERSHIP" as const;

	handle(action: TransferOwnershipAction, ctx: ActionContext): void {
		const { state } = ctx;
		const payload = action.payload;
		const targetPlayerId = payload?.newOwnerId ?? payload?.targetPlayerId;

		if (targetPlayerId) {
			if (
				action.actorId !== state.ownerId &&
				action.actorId !== "system"
			) {
				throw new PlayerNotRoomOwnerError();
			}
			const target = state.players.find((p) => p.id === targetPlayerId);
			if (!target) {
				throw new PlayerNotFoundError(targetPlayerId);
			}
			state.ownerId = target.id;
			state.ownerOfflineSince = null;
			return;
		}

		// Automatic timeout transfer
		const owner = state.players.find((p) => p.id === state.ownerId);
		if (owner && owner.isOnline !== false) {
			state.ownerOfflineSince = null;
			return;
		}

		const now = ctx.now ?? Date.now();
		const timeout = payload?.timeoutMs ?? OWNER_OFFLINE_TIMEOUT_MS;

		if (
			state.ownerOfflineSince &&
			now - state.ownerOfflineSince < timeout
		) {
			return;
		}

		const onlineTeamPlayer = state.players.find(
			(p) => p.id !== state.ownerId && p.isOnline !== false && p.teamId,
		);
		const onlineSpectator = state.players.find(
			(p) => p.id !== state.ownerId && p.isOnline !== false,
		);
		const newOwner = onlineTeamPlayer ?? onlineSpectator;

		if (newOwner) {
			state.ownerId = newOwner.id;
			state.ownerOfflineSince = null;
		}
	}
}

export class UpdateSettingsStrategy implements ActionStrategy<UpdateSettingsAction> {
	readonly actionType = "UPDATE_SETTINGS" as const;

	handle(action: UpdateSettingsAction, ctx: ActionContext): void {
		const { state } = ctx;

		if (action.actorId !== state.ownerId) {
			throw new PlayerNotRoomOwnerError();
		}
		if (state.status !== "LOBBY") {
			throw new GameNotInLobbyError();
		}

		const newSettings = action.payload;
		const currentSettings = state.settings ?? {};
		const hatModeChanged =
			newSettings.isHatMode !== undefined &&
			newSettings.isHatMode !== currentSettings.isHatMode;
		const wordsPerPlayerChanged =
			newSettings.wordsPerPlayer !== undefined &&
			newSettings.wordsPerPlayer !== currentSettings.wordsPerPlayer;

		state.settings = { ...currentSettings, ...newSettings };
		if (state.settings.isHatMode === false) {
			state.settings.wordsPerPlayer = 0;
		}
		if (newSettings.pointsToWin !== undefined) {
			state.pointsToWin = newSettings.pointsToWin;
		}
		if (newSettings.roundTimeSeconds !== undefined) {
			state.roundTimeSeconds = newSettings.roundTimeSeconds;
		}

		if (hatModeChanged || wordsPerPlayerChanged) {
			for (const p of state.players) {
				p.submittedWordsCount = 0;
			}
		}
	}
}

export class SubmitCustomWordsStrategy implements ActionStrategy<SubmitCustomWordsAction> {
	readonly actionType = "SUBMIT_CUSTOM_WORDS" as const;

	handle(action: SubmitCustomWordsAction, ctx: ActionContext): void {
		const { state } = ctx;

		if (state.status !== "LOBBY") {
			throw new GameNotInLobbyError();
		}

		if (!state.settings?.isHatMode) {
			throw new HatModeDisabledError();
		}

		if (
			!state.settings.wordsPerPlayer ||
			state.settings.wordsPerPlayer <= 0
		) {
			throw new WordsPerPlayerNotConfiguredError();
		}

		const { wordsCount } = action.payload;
		if (wordsCount !== state.settings.wordsPerPlayer) {
			throw new InvalidSubmittedWordsCountError(
				state.settings.wordsPerPlayer,
				wordsCount,
			);
		}

		const player = state.players.find((p) => p.id === action.actorId);
		if (!player) {
			throw new PlayerNotFoundError(action.actorId ?? "");
		}

		player.submittedWordsCount = wordsCount;
	}
}
