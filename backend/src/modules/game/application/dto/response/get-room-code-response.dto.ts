import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class GetRoomCodeResponseDto {
	@ApiProperty({ type: "string" })
	@IsString()
	@Length(6)
	code: string | null;
}
