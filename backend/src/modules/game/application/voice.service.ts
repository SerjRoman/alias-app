import { UserDto } from "@common/dto/user.dto";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AccessToken, RoomServiceClient, TrackType } from "livekit-server-sdk";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "./game.repository.interface";
import { RoomNotFoundError } from "../domain/errors/game.errors";

class ToggleMuteDto {
	roomId: string;
	userId: string;
	value: boolean;
}

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
	public async toggleMute(
		dto: ToggleMuteDto,
		actor: UserDto,
	): Promise<string> {
		const roomName = `${this.ROOM_PREFIX}${dto.roomId}`;
		const participantName = `${this.PARTICIPANT_PREFIX}${dto.userId}`;
		const game = await this.gameRepository.findGameById(dto.roomId);
		if (!game) {
			throw new RoomNotFoundError(dto.roomId);
		}
		game.assertRoomOwner(actor.id);
		try {
			const participant = await this.roomServiceClient.getParticipant(
				roomName,
				participantName,
			);

			const audioTrack = participant.tracks.find(
				(track) => track.type === TrackType.AUDIO,
			);

			if (audioTrack) {
				await this.roomServiceClient.mutePublishedTrack(
					roomName,
					participantName,
					audioTrack.sid,
					dto.value,
				);
				return "Success";
			}
			return "Audio track not found";
		} catch (error) {
			console.error("Error toggling mute:", error);
			return "Error";
		}
	}
}
