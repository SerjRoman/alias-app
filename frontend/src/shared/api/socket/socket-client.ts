import { io } from "socket.io-client";
import { WS_URL } from "../urls";
import { toast } from "sonner";

import i18n from "../../config/i18n/i18n";

export const socketClient = io(WS_URL, {
	autoConnect: false,
	extraHeaders: {
		"ngrok-skip-browser-warning": "true",
	},
});

export interface WsErrorPayload {
	code?: string;
	name?: string;
	message?: string;
	details?: Record<string, unknown>;
	teamId?: string;
	teamName?: string;
	playerId?: string;
	playerName?: string;
	roomId?: string;
}

export type WsErrorResolver = (
	error: WsErrorPayload,
) => string | null | undefined;

let customErrorResolver: WsErrorResolver | null = null;

export function setWsErrorResolver(resolver: WsErrorResolver | null) {
	customErrorResolver = resolver;
}

interface WsExceptionData {
	event?: string;
	data?: WsErrorPayload;
	code?: string;
	message?: string;
	name?: string;
	details?: Record<string, unknown>;
	teamId?: string;
	teamName?: string;
	playerId?: string;
	playerName?: string;
	roomId?: string;
}

export function resolveWsErrorMessage(error: unknown): string {
	const err = (error ?? {}) as WsExceptionData;
	const payloadDetails = {
		...(err?.data?.details || {}),
		...(err?.details || {}),
	};
	const payload: WsErrorPayload = {
		code: err?.data?.code || err?.code,
		name: err?.data?.name || err?.name,
		message: err?.data?.message || err?.message,
		details: payloadDetails,
		teamId:
			(payloadDetails.teamId as string) ||
			err?.data?.teamId ||
			err?.teamId,
		teamName:
			(payloadDetails.teamName as string) ||
			err?.data?.teamName ||
			err?.teamName,
		playerId:
			(payloadDetails.playerId as string) ||
			err?.data?.playerId ||
			err?.playerId,
		playerName:
			(payloadDetails.playerName as string) ||
			err?.data?.playerName ||
			err?.playerName,
		roomId:
			(payloadDetails.roomId as string) ||
			err?.data?.roomId ||
			err?.roomId,
	};

	if (customErrorResolver) {
		const customMessage = customErrorResolver(payload);
		if (customMessage) {
			return customMessage;
		}
	}

	const code = payload.code;
	if (code) {
		const i18nKey = `gameErrors.${code}`;
		if (i18n.exists(i18nKey as unknown as string)) {
			const translate = i18n.t as unknown as (
				key: string,
				options?: Record<string, unknown>,
			) => string;
			return translate(i18nKey, {
				...payload.details,
				teamName: payload.teamName,
				playerName: payload.playerName,
				teamId: payload.teamId,
				playerId: payload.playerId,
				roomId: payload.roomId,
			});
		}
	}

	const rawMessage = payload.message || "WebSocket Error";
	const errorName = payload.name;

	// Check if this is TeamHasNoOnlinePlayersError or message matches "Team ... has no online players"
	const noOnlineMatch = rawMessage.match(
		/Team\s+(?:"([^"]+)"|([a-f0-9-]+))\s+has no online players/i,
	);
	if (errorName === "TeamHasNoOnlinePlayersError" || noOnlineMatch) {
		const teamNameOrId =
			payload.teamName ||
			noOnlineMatch?.[1] ||
			payload.teamId ||
			noOnlineMatch?.[2] ||
			"";
		return i18n.t("gameErrors.TEAM_HAS_NO_ONLINE_PLAYERS", {
			teamName: teamNameOrId,
			defaultValue: `У команды "${teamNameOrId}" нет игроков онлайн`,
		});
	}

	// Check if this is TeamIsPlayingError or message matches "Cannot delete team ... currently playing"
	const playingMatch = rawMessage.match(
		/Cannot delete team\s+(?:"([^"]+)"|([a-f0-9-]+)):\s+team is currently playing/i,
	);
	if (errorName === "TeamIsPlayingError" || playingMatch) {
		const teamNameOrId =
			payload.teamName ||
			playingMatch?.[1] ||
			payload.teamId ||
			playingMatch?.[2] ||
			"";
		return i18n.t("gameErrors.TEAM_IS_PLAYING", {
			teamName: teamNameOrId,
			defaultValue: `Нельзя удалить команду "${teamNameOrId}": она сейчас играет в активном раунде`,
		});
	}

	return rawMessage;
}

socketClient.on("exception", (error: unknown) => {
	console.error("WS Exception encountered:", error);
	const message = resolveWsErrorMessage(error);
	toast.error(message);
});

let wasDisconnected = false;

socketClient.on("disconnect", (reason) => {
	console.warn("Socket disconnected:", reason);
	if (reason !== "io client disconnect" && reason !== "io server disconnect") {
		wasDisconnected = true;
		toast.error(i18n.t("common.connectionLost", "Connection lost. Reconnecting..."), {
			id: "socket-disconnect",
			duration: Infinity,
		});
	}
});

socketClient.on("connect", () => {
	console.log("Socket connected");
	toast.dismiss("socket-disconnect");
	if (wasDisconnected) {
		wasDisconnected = false;
		toast.success(i18n.t("common.connectionRestored", "Connection restored!"), {
			id: "socket-connect",
			duration: 3000,
		});
	}
});

