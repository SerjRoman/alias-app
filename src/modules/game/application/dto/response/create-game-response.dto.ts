import { ApiProperty } from "@nestjs/swagger";
import { GameResponseDto } from "./game-response.dto";
import { Expose } from "class-transformer";

export class CreateGameResponseDto extends GameResponseDto {
	@ApiProperty({ type: "string" })
	@Expose()
	code: string | null;
}
