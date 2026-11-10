import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsString } from "class-validator";

export class GetUsersShortInfoDto {
	@ApiProperty({ type: [String], description: "Array of user IDs" })
	@IsArray()
	@IsString({ each: true })
	@Transform(({ value }: { value: unknown }) =>
		Array.isArray(value) ? (value as string[]) : [value as string],
	)
	userIds: string[];
}
