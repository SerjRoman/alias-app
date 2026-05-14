import { Expose } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserDto } from "@common/dto/user.dto";

export class MeDto {
	@ApiProperty({ type: "string", description: "JWT access token" })
	@Expose()
	accessToken: string;
}
export class MeDtoResponse extends UserDto {
	@ApiPropertyOptional({ example: "john_doe" })
	@Expose()
	username?: string;

	@ApiPropertyOptional({ example: "user@example.com" })
	@Expose()
	email?: string;

	@ApiPropertyOptional({ example: "https://example.com/avatar.jpg" })
	@Expose()
	avatarUrl?: string;
}
