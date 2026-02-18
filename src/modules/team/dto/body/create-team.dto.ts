import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID } from "class-validator";

export class CreateTeamDto {
	@IsString()
	@IsUUID()
	@ApiProperty({
		description:
			"The unique identifier of the game room to which the team will be added.",
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
	})
	roomId: string;
	@IsString()
	@ApiProperty({
		description: "The name of the team to be created.",
		example: "Team Alpha",
	})
	teamName: string;
}
