import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class GetVoiceTokenResponseDto {
	@ApiProperty({
		description: "The token to join the voice room",
		example:
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
	})
	@Expose()
	token: string;
}
