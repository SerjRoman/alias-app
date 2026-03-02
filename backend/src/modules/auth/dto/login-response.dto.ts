import { ApiProperty } from "@nestjs/swagger";
class UserDto {
	@ApiProperty({
		description: "Unique UUID",
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
	})
	id: string;

	@ApiProperty({ description: "User name", example: "Alex" })
	name: string;
}

export class LoginResponseDto {
	@ApiProperty({
		description: "JWT token",
		example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
	})
	accessToken: string;

	@ApiProperty({ description: "User info" })
	user: UserDto;
}
