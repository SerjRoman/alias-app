import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class UserDto {
	@ApiProperty({
		type: "string",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@Expose()
	id: string;
	@ApiProperty({
		type: "string",
		example: "John Doe",
	})
	@Expose()
	name: string;

	@ApiProperty({ example: "registered", enum: ["registered", "anonymous"] })
	@Expose()
	role: "registered" | "anonymous";
}
