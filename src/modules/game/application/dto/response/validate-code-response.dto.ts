import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class ValidateCodeResponseDto {
	@ApiProperty({ type: "boolean" })
	@Expose()
	valid: boolean;
}
