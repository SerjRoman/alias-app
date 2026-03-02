import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsString, IsUUID } from "class-validator";

export class PlayerLeaveRoomBodyDto {
	@ApiProperty({
		type: "string",
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
	})
	@Expose()
	@IsString()
	@IsUUID()
	roomId: string;
}

export class PlayerLeftRoomDto {
	@ApiProperty({
		type: "string",
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
	})
	@Expose()
	@IsString()
	@IsUUID()
	roomId: string;

	@ApiProperty({
		type: "string",
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
	})
	@Expose()
	@IsString()
	@IsUUID()
	playerId: string;
}
