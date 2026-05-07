import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class AnonymousLoginDto {
	@ApiProperty({ example: "Guest_123" })
	@IsString()
	@IsNotEmpty()
	name: string;
}
