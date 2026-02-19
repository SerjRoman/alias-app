import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class WordDto {
	@ApiProperty({ example: "uuid-word-1", description: "Word ID" })
	@Expose()
	id: string;

	@ApiProperty({ example: "Apple", description: "The word text" })
	@Expose()
	text: string;
}
