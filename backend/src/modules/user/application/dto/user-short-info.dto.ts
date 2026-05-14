import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class UserShortInfoResponseDto {
	@ApiProperty({ description: "User's ID" })
	@Expose()
	id: string;
	@ApiProperty({ description: "User's full name" })
	@Expose()
	name: string;

	@ApiProperty({ description: "User's internal username" })
	@Expose()
	username: string;

	@ApiProperty({ description: "User's avatar URL" })
	@Expose()
	avatarUrl: string;
}
