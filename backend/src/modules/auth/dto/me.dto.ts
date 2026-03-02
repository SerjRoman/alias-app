import { Expose } from "class-transformer";
import { UserDto } from "./user.dto";
import { ApiProperty } from "@nestjs/swagger";

export class MeDto {
	@ApiProperty({ type: "string", description: "JWT access token" })
	@Expose()
	accessToken: string;
}
export class MeDtoResponse extends UserDto {}
