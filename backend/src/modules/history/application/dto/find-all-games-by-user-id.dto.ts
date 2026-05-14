import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";
import { PaginationQueryDto } from "@common/dto/pagination-query.dto";

export class FindAllGamesByUserIdDto extends PaginationQueryDto {
	@ApiProperty({
		description: "The ID of the user whose game history is being requested",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@IsUUID()
	userId: string;
}
