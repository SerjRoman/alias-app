import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class PaginatedResponseDto<T> {
	@ApiProperty({ isArray: true })
	@Expose()
	items: T[];

	@ApiProperty()
	@Expose()
	total: number;

	@ApiProperty()
	@Expose()
	limit: number;

	@ApiProperty()
	@Expose()
	offset: number;

	constructor(items: T[], total: number, limit: number, offset: number) {
		this.items = items;
		this.total = total;
		this.limit = limit;
		this.offset = offset;
	}
}
