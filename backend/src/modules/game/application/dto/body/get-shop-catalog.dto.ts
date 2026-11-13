import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsString, IsUUID } from "class-validator";

export class GetShopCatalogDto {
	@ApiProperty({
		type: "string",
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
		description: "Room ID to get the shop catalog for",
	})
	@Expose()
	@IsString()
	@IsUUID()
	roomId: string;
}
