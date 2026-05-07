import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class RegisterDto {
	@ApiProperty({ example: "user@example.com" })
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@ApiProperty({ example: "John Doe" })
	@IsString()
	@IsNotEmpty()
	name: string;

	@ApiProperty({ example: "john_doe" })
	@IsString()
	@IsNotEmpty()
	@MinLength(3)
	username: string;

	@ApiProperty({ example: "password123" })
	@IsString()
	@MinLength(6)
	password: string;
}
