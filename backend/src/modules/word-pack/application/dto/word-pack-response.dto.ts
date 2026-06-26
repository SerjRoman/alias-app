import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class WordPackResponseDto {
	@ApiProperty({ example: "a1b2c3d4-e5f6-7890-1234-567890abcdef" })
	@Expose()
	id: string;

	@ApiProperty({ example: "Classic Pack" })
	@Expose()
	name: string;

	@ApiProperty({
		example: "Contains standard vocabulary words.",
		nullable: true,
		type: String,
	})
	@Expose()
	description: string | null;

	@ApiProperty({ example: "en" })
	@Expose()
	language: string;

	@ApiProperty({ example: "standard" })
	@Expose()
	type: string;

	@ApiProperty({ example: 1250 })
	@Expose()
	wordCount: number;

	@ApiProperty({ example: "user-123", nullable: true })
	@Expose()
	createdBy: string | null;
}
