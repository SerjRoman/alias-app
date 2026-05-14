import { OnEvent } from "@nestjs/event-emitter";
import {
	USER_REPOSITORY,
	type IUserRepository,
} from "../user.repository.interface";
import { GameFinishedEvent } from "../../../game/domain/events/game.events";
import { Inject, Injectable } from "@nestjs/common";

@Injectable()
export class UpdateUserStatOnGameFinishedHandler {
	constructor(
		@Inject(USER_REPOSITORY)
		private readonly userRepository: IUserRepository,
	) {}
	@OnEvent(GameFinishedEvent.eventName)
	async execute(event: GameFinishedEvent) {
		const playerIds = event.gameState.players
			.map((player) =>
				player.id && player.role === "registered" ? player.id : null,
			)
			.filter(Boolean) as string[];
		const users = await this.userRepository.findManyByIds(playerIds);
		const winnerTeamId = event.gameState.winnerTeamId;
		const updatedUsers = users.map((user) => {
			const playerState = event.gameState.players.find(
				(p) => p.id === user.id,
			);
			if (!playerState) return user;

			const isWinner = event.gameState.teams.some(
				(team) =>
					team.id === winnerTeamId &&
					team.playerIds.includes(user.id),
			);
			if (isWinner) {
				user.addGameResult(playerState.score, true);
			} else {
				user.addGameResult(playerState.score, false);
			}
			return user;
		});
		await this.userRepository.saveMany(updatedUsers);
	}
}
