import { Injectable } from "@nestjs/common";
import { RoomUseCase } from "../room.use-case";
import { TransferOwnershipDto } from "../../dto/body";
import type { GameEngine } from "../../../domain/engine/game-engine";
import type { UserDto } from "@common/dto/user.dto";

@Injectable()
export class TransferOwnershipUseCase extends RoomUseCase<TransferOwnershipDto> {
	protected override notify = ["game", "players"] as const;

	protected override handle(
		room: GameEngine,
		dto: TransferOwnershipDto,
		actor: UserDto,
	) {
		room.dispatch({
			type: "TRANSFER_OWNERSHIP",
			actorId: actor.id,
			payload: {
				newOwnerId: dto.newOwnerId,
				timeoutMs: dto.timeoutMs,
			},
		});
	}
}
