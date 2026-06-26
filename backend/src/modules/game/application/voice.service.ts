import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "./game.repository.interface";
import {
	RoomNotFoundError,
	VoiceChatDisabledError,
} from "../domain/errors/game.errors";

@Injectable()
export class VoiceService {
	private readonly roomServiceClient: RoomServiceClient;
	readonly ROOM_PREFIX = "game-voice-room-";
	readonly TEAM_PREFIX = "game-voice-team-";
	readonly PARTICIPANT_PREFIX = "game-voice-participant-";
	constructor(
		private readonly configService: ConfigService,
		@Inject(GAME_REPOSITORY)
		private readonly gameRepository: IGameRepository,
	) {
		this.roomServiceClient = new RoomServiceClient(
			this.configService.getOrThrow("LIVEKIT_URL"),
			this.configService.getOrThrow("LIVEKIT_KEY"),
			this.configService.getOrThrow("LIVEKIT_SECRET"),
		);
	}
	public async joinGameRoom(roomId: string, userId: string): Promise<string> {
		const game = await this.gameRepository.findGameById(roomId);
		if (!game) {
			throw new RoomNotFoundError(roomId);
		}
		if (!game.settings.isVoiceChatEnabled) {
			throw new VoiceChatDisabledError();
		}
		const key = this.configService.getOrThrow("LIVEKIT_KEY");
		const secret = this.configService.getOrThrow("LIVEKIT_SECRET");
		const roomName = `${this.ROOM_PREFIX}${roomId}`;
		const participantName = `${this.PARTICIPANT_PREFIX}${userId}`;
		const accessToken = new AccessToken(key, secret, {
			identity: participantName,
		});
		accessToken.addGrant({
			roomJoin: true,
			room: roomName,
			canPublish: true,
			canSubscribe: true,
			canPublishData: true,
		});

		return accessToken.toJwt();
	}
	public async deleteVoiceRoom(roomId: string): Promise<void> {
		const roomName = `${this.ROOM_PREFIX}${roomId}`;
		try {
			await this.roomServiceClient.deleteRoom(roomName);
		} catch (error) {
			console.warn(
				`Warning/Error when deleting LiveKit room ${roomName}:`,
				error,
			);
		}
	}
}
