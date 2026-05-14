import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class UploadAvatarDto {
	@ApiProperty({
		type: "string",
		format: "binary",
		description: "Avatar",
	})
	avatar: Express.Multer.File;
}
export class UploadAvatarResponseDto {
	@ApiProperty({
		type: "string",
		description: "New avatar URL",
	})
	@Expose()
	newAvatar: string;
}
