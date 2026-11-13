import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsString, IsUUID, MaxLength } from "class-validator";
import type { ChatChannel } from "../../chat/chat.types";

export class SendChatMessageDto {
	@ApiProperty({
		description: "ID of the game room",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@IsUUID()
	roomId: string;

	@ApiProperty({
		description: "Target chat channel",
		enum: ["all", "team"],
	})
	@IsIn(["all", "team"])
	channel: ChatChannel;

	@ApiProperty({
		description: "Chat message text",
		maxLength: 500,
	})
	@IsString()
	@IsNotEmpty()
	@MaxLength(500)
	text: string;
}
