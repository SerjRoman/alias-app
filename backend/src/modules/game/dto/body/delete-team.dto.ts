import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsString, IsUUID } from "class-validator";

export class DeleteTeamDto {
	@ApiProperty({ example: "uuid-team-1", description: "Team ID" })
	@Expose()
	@IsString()
	@IsUUID()
	teamId: string;
	@ApiProperty({ example: "uuid-room-1", description: "Game Room ID" })
	@Expose()
	@IsString()
	@IsUUID()
	roomId: string;
}
