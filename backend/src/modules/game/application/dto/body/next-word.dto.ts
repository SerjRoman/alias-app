import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, IsUUID } from "class-validator";

export class NextWordDto {
	@ApiProperty({
		type: "string",
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
	})
	@IsString()
	@IsUUID()
	roomId: string;

	@ApiProperty({ type: "boolean" })
	@IsBoolean()
	@IsOptional()
	wasSkipped?: boolean = false;
}
