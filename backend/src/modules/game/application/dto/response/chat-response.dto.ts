import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import {
	IsBoolean,
	IsIn,
	IsNumber,
	IsObject,
	IsOptional,
	IsString,
	IsUUID,
	ValidateNested,
} from "class-validator";
import type { ChatChannel, SystemLogType } from "../../chat/chat.types";

export class ChatActionResponseDto {
	@ApiProperty({
		description: "Whether the chat action succeeded",
		example: true,
	})
	@Expose()
	@IsBoolean()
	success: boolean;
}

export class ChatMessageResponseDto {
	@ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
	@Expose()
	@IsUUID()
	id: string;

	@ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
	@Expose()
	@IsUUID()
	roomId: string;

	@ApiProperty({ enum: ["all", "team"], example: "all" })
	@Expose()
	@IsIn(["all", "team"])
	channel: ChatChannel;

	@ApiPropertyOptional({ example: "team-1" })
	@Expose()
	@IsOptional()
	@IsString()
	teamId?: string;

	@ApiProperty({ example: "user-1" })
	@Expose()
	@IsString()
	senderId: string;

	@ApiProperty({ example: "Alice" })
	@Expose()
	@IsString()
	senderName: string;

	@ApiPropertyOptional({ example: "#38bdf8" })
	@Expose()
	@IsOptional()
	@IsString()
	senderTeamColor?: string;

	@ApiProperty({ example: "Hello everyone!" })
	@Expose()
	@IsString()
	text: string;

	@ApiProperty({ example: 1731500000000 })
	@Expose()
	@IsNumber()
	createdAt: number;
}

export class SystemLogEntryResponseDto {
	@ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440001" })
	@Expose()
	@IsUUID()
	id: string;

	@ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
	@Expose()
	@IsUUID()
	roomId: string;

	@ApiProperty({
		enum: ["info", "effect", "leader", "round", "admin", "private"],
		example: "round",
	})
	@Expose()
	@IsIn(["info", "effect", "leader", "round", "admin", "private"])
	type: SystemLogType;

	@ApiProperty({ example: "gameView.systemLogs.roundStarted" })
	@Expose()
	@IsString()
	i18nKey: string;

	@ApiPropertyOptional({
		example: { roundNumber: 1, teamName: "Alpha", explainerName: "Alice" },
	})
	@Expose()
	@IsOptional()
	@IsObject()
	i18nParams?: Record<string, string | number>;

	@ApiPropertyOptional({ example: false })
	@Expose()
	@IsOptional()
	@IsBoolean()
	isPrivate?: boolean;

	@ApiProperty({ example: 1731500000000 })
	@Expose()
	@IsNumber()
	createdAt: number;
}

export class ChatHistoryResponseDto {
	@ApiProperty({ type: [ChatMessageResponseDto] })
	@Expose()
	@ValidateNested({ each: true })
	@Type(() => ChatMessageResponseDto)
	messages: ChatMessageResponseDto[];

	@ApiProperty({ type: [SystemLogEntryResponseDto] })
	@Expose()
	@ValidateNested({ each: true })
	@Type(() => SystemLogEntryResponseDto)
	logs: SystemLogEntryResponseDto[];
}
