import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginDto {
	@ApiProperty({
		description: "Name of the user in the game",
		example: "Alex",
	})
	@IsString()
	@IsNotEmpty()
	@MinLength(2)
	name: string;
}
