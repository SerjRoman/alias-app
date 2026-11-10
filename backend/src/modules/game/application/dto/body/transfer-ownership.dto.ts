import { IsOptional, IsString, IsUUID, IsNumber } from "class-validator";

export class TransferOwnershipDto {
	@IsUUID()
	roomId: string;

	@IsOptional()
	@IsString()
	newOwnerId?: string;

	@IsOptional()
	@IsNumber()
	timeoutMs?: number;
}
