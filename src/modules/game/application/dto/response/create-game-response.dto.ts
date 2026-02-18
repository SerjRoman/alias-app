import { Expose } from "class-transformer";

export class CreateGameResponseDto {
	@Expose()
	id: string;
	@Expose()
	name: string;
	@Expose()
	isPrivate: boolean;
	@Expose()
	ownerId: string;
	@Expose()
	isGameStarted: boolean;
}
