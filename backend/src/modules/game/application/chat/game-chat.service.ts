import { Inject, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { v4 as uuidv4 } from "uuid";
import type { UserDto } from "@common/dto/user.dto";
import { RoundStatus } from "../../domain";
import { RoomNotFoundError } from "../../domain/errors/game.errors";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "../game.repository.interface";
import { RedisChatRepository } from "../../infrastructure/redis-chat.repository";
import type { SendChatMessageDto } from "../dto/body/send-chat-message.dto";
import {
	CHAT_MESSAGE_CREATED,
	SYSTEM_LOG_CREATED,
	SYSTEM_LOG_KEYS,
	type ChatHistoryDto,
	type ChatMessageCreatedPayload,
	type ChatMessageDto,
	type SystemLogCreatedPayload,
	type SystemLogEntryDto,
	type SystemLogType,
} from "./chat.types";
import type { ChatActionResponseDto } from "../dto/response";

@Injectable()
export class GameChatService {
	constructor(
		@Inject(GAME_REPOSITORY)
		private readonly gameRepository: IGameRepository,
		private readonly chatRepository: RedisChatRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}

	async sendPlayerMessage(
		user: UserDto,
		dto: SendChatMessageDto,
	): Promise<ChatActionResponseDto> {
		const trimmedText = dto.text.trim();
		if (!trimmedText) {
			return { success: false };
		}

		const engine = await this.gameRepository.findGameById(dto.roomId);
		if (!engine) {
			throw new RoomNotFoundError(dto.roomId);
		}

		const state = engine.getState();
		const player = state.players.find((p) => p.id === user.id);
		if (!player) {
			return { success: false };
		}

		if (dto.channel === "team") {
			if (!player.teamId) {
				await this.emitPrivateSystemLog(
					dto.roomId,
					user.id,
					SYSTEM_LOG_KEYS.SPECTATOR_TEAM_CHAT_BLOCKED,
				);
				return { success: false };
			}

			const isExplainerInActiveRound =
				state.currentRound?.status === RoundStatus.IN_PROGRESS &&
				state.currentRound.explainerId === user.id;

			if (isExplainerInActiveRound) {
				await this.emitPrivateSystemLog(
					dto.roomId,
					user.id,
					SYSTEM_LOG_KEYS.EXPLAINER_TEAM_CHAT_BLOCKED,
				);
				return { success: false };
			}
		}

		const team = player.teamId
			? state.teams.find((t) => t.id === player.teamId)
			: undefined;

		const message: ChatMessageDto = {
			id: uuidv4(),
			roomId: dto.roomId,
			channel: dto.channel,
			teamId: dto.channel === "team" ? player.teamId : undefined,
			senderId: user.id,
			senderName: player.name || user.name,
			senderTeamColor: team?.color,
			text: trimmedText,
			createdAt: Date.now(),
		};

		await this.chatRepository.appendMessage(dto.roomId, message);

		const payload: ChatMessageCreatedPayload = {
			roomId: dto.roomId,
			message,
		};
		this.eventEmitter.emit(CHAT_MESSAGE_CREATED, payload);

		return { success: true };
	}

	async emitPublicSystemLog(
		roomId: string,
		type: SystemLogType,
		i18nKey: string,
		i18nParams?: Record<string, string | number>,
	): Promise<void> {
		const log: SystemLogEntryDto = {
			id: uuidv4(),
			roomId,
			type,
			i18nKey,
			i18nParams,
			isPrivate: false,
			createdAt: Date.now(),
		};

		await this.chatRepository.appendLog(roomId, log);

		const payload: SystemLogCreatedPayload = { roomId, log };
		this.eventEmitter.emit(SYSTEM_LOG_CREATED, payload);
	}

	async emitPrivateSystemLog(
		roomId: string,
		targetUserId: string,
		i18nKey: string,
		i18nParams?: Record<string, string | number>,
	): Promise<void> {
		const log: SystemLogEntryDto = {
			id: uuidv4(),
			roomId,
			type: "private",
			i18nKey,
			i18nParams,
			isPrivate: true,
			targetUserId,
			createdAt: Date.now(),
		};

		await this.chatRepository.appendLog(roomId, log);

		const payload: SystemLogCreatedPayload = { roomId, log };
		this.eventEmitter.emit(SYSTEM_LOG_CREATED, payload);
	}

	async getHistoryForPlayer(
		roomId: string,
		userId: string,
	): Promise<ChatHistoryDto> {
		const engine = await this.gameRepository.findGameById(roomId);
		const player = engine?.getState().players.find((p) => p.id === userId);
		const userTeamId = player?.teamId;

		const [messages, logs] = await Promise.all([
			this.chatRepository.getMessages(roomId, userTeamId),
			this.chatRepository.getLogs(roomId, userId),
		]);

		return { messages, logs };
	}
}
