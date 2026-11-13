import {
	useGameSlice,
	usePrivatePlayerSlice,
	useChatSlice,
	RoundStatus,
	type PrivatePlayerState,
	type WordState,
	type ChatMessage,
	type SystemLogEntry,
} from "@entities/game";
import { socketClient, useAuth } from "@shared/api";
import { useEffect } from "react";

export function useActiveGameSync() {
	const setCurrentWord = useGameSlice((state) => state.setCurrentWord);
	const roomId = useGameSlice((state) => state.game?.id);
	const roundStatus = useGameSlice(
		(state) => state.game?.currentRound?.status,
	);
	const explainerId = useGameSlice(
		(state) => state.game?.currentRound?.explainerId,
	);
	const hasCurrentWord = useGameSlice((state) => Boolean(state.currentWord));
	const setPlayerState = usePrivatePlayerSlice(
		(state) => state.setPlayerState,
	);
	const setChatHistory = useChatSlice((state) => state.setHistory);
	const addChatMessage = useChatSlice((state) => state.addMessage);
	const addSystemLog = useChatSlice((state) => state.addLog);
	const resetChat = useChatSlice((state) => state.resetChat);
	const { user } = useAuth();

	useEffect(() => {
		function handleWord(word: WordState) {
			setCurrentWord(word);
		}
		function handlePrivateState(state: PrivatePlayerState) {
			setPlayerState(state);
		}
		function handleChatHistory(data: {
			messages: ChatMessage[];
			logs: SystemLogEntry[];
		}) {
			setChatHistory(data.messages, data.logs);
		}
		function handleChatMessage(msg: ChatMessage) {
			addChatMessage(msg);
		}
		function handleSystemLog(log: SystemLogEntry) {
			addSystemLog(log);
		}

		socketClient.on("explainerWord", handleWord);
		socketClient.on("privateStateUpdated", handlePrivateState);
		socketClient.on("chatHistory", handleChatHistory);
		socketClient.on("chatMessage", handleChatMessage);
		socketClient.on("systemLog", handleSystemLog);

		return () => {
			socketClient.off("explainerWord", handleWord);
			socketClient.off("privateStateUpdated", handlePrivateState);
			socketClient.off("chatHistory", handleChatHistory);
			socketClient.off("chatMessage", handleChatMessage);
			socketClient.off("systemLog", handleSystemLog);
		};
	}, [
		setCurrentWord,
		setPlayerState,
		setChatHistory,
		addChatMessage,
		addSystemLog,
	]);

	useEffect(() => {
		if (!roomId) {
			resetChat();
			return;
		}
		socketClient.emit(
			"getPrivateState",
			{ roomId },
			(state: PrivatePlayerState | null) => {
				if (state) {
					setPlayerState(state);
				}
			},
		);
		socketClient.emit(
			"getChatHistory",
			{ roomId },
			(history: { messages: ChatMessage[]; logs: SystemLogEntry[] } | null) => {
				if (history) {
					setChatHistory(history.messages, history.logs);
				}
			},
		);
	}, [roomId, setPlayerState, setChatHistory, resetChat]);

	useEffect(() => {
		if (
			!roomId ||
			!user ||
			roundStatus !== RoundStatus.IN_PROGRESS ||
			explainerId !== user.id ||
			hasCurrentWord
		) {
			return;
		}
		socketClient.emit(
			"getExplainerWord",
			{ roomId },
			(word: WordState | null) => {
				if (word) {
					setCurrentWord(word);
				}
			},
		);
	}, [roomId, user, roundStatus, explainerId, hasCurrentWord, setCurrentWord]);
}
