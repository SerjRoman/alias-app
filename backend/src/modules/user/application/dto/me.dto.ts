import { Expose } from "class-transformer";
import { UserDto } from "./user.dto";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class MeDto {
	@ApiProperty({ type: "string", description: "JWT access token" })
	@Expose()
	accessToken: string;
}
export class MeDtoResponse extends UserDto {
	@ApiProperty({ example: "registered" })
	@Expose()
	role: string;

	@ApiPropertyOptional({ example: "john_doe" })
	@Expose()
	username?: string;

	@ApiPropertyOptional({ example: "user@example.com" })
	@Expose()
	email?: string;
}
