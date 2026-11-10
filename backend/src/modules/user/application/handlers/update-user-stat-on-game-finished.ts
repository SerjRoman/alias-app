import { OnEvent } from "@nestjs/event-emitter";
import {
	USER_REPOSITORY,
	type IUserRepository,
} from "../user.repository.interface";
import { GameFinishedEvent } from "../../../game/domain";
import { Inject, Injectable } from "@nestjs/common";

@Injectable()
export class UpdateUserStatOnGameFinishedHandler {
	constructor(
		@Inject(USER_REPOSITORY)
		private readonly userRepository: IUserRepository,
	) {}
	@OnEvent(GameFinishedEvent.eventName)
	async execute(event: GameFinishedEvent) {
		const allPlayers = [
			...(event.gameState.players ?? []),
			...(event.gameState.leftPlayers ?? []).map((lp) => ({
				id: lp.id,
				role: "registered" as const,
				score: lp.score,
				teamId: lp.teamId ?? undefined,
			})),
		];
		const playerIds = allPlayers
			.map((player) =>
				player.id && player.role === "registered" ? player.id : null,
			)
			.filter(Boolean) as string[];
		const users = await this.userRepository.findManyByIds(playerIds);
		const winnerTeamId = event.gameState.winnerTeamId;
		const updatedUsers = users.map((user) => {
			const playerState = allPlayers.find((p) => p.id === user.id);
			if (!playerState) return user;

			const isWinner =
				Boolean(winnerTeamId) && playerState.teamId === winnerTeamId;
			const playerScore = playerState.score ?? 0;
			if (isWinner) {
				user.addGameResult(playerScore, true);
			} else {
				user.addGameResult(playerScore, false);
			}
			return user;
		});
		await this.userRepository.saveMany(updatedUsers);
	}
}
