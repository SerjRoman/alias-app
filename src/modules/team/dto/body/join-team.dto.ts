import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID } from "class-validator";

export class JoinTeamDto {
	@ApiProperty({
		description: "The unique identifier of the game room.",
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
	})
	@IsString()
	@IsUUID()
	roomId: string;
	@ApiProperty({
		description: "The unique identifier of the team to join.",
		example: "team1",
	})
	@IsString()
	@IsUUID()
	teamId: string;
}
