import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID } from "class-validator";

export class StartPointingDto {
	@ApiProperty({ description: "The ID of the room to start pointing in" })
	@IsString()
	@IsUUID()
	roomId: string;
}
