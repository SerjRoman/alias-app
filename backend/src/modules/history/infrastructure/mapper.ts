import { HistoryRoundEntity } from "../domain/history-round.entity";
import { HistoryGameEntity } from "../domain/history.entity";
import { HistoryGameState } from "../domain/types";
import {
	HistoryGameOrmEntity,
	HistoryParticipantOrmEntity,
	HistoryRoundOrmEntity,
	HistoryTeamOrmEntity,
	HistoryRoundParticipantOrmEntity,
} from "./entities";

export class HistoryGameMapper {
	static toDomain(orm: HistoryGameOrmEntity): HistoryGameEntity {
		const state: HistoryGameState = {
			id: orm.id,
			ownerId: orm.ownerId,
			status: orm.status,
			winnerTeamId: orm.winnerTeamId,
			settings: orm.settings,
			teamsFinalState: orm.teamsFinalState,
			playersFinalState: orm.playersFinalState,
			createdAt: orm.createdAt,
			updatedAt: orm.updatedAt,

			teams:
				orm.teams?.map((t) => ({
					id: t.id,
					name: t.name,
				})) || [],

			rounds:
				orm.rounds?.map((r) => ({
					id: r.id,
					gameId: r.gameId,
					teamId: r.teamId,
					guesserId: r.guesserId,
					words: r.words,
					roundNumber: r.roundNumber,
					participants:
						r.participants?.map((rp) => ({
							id: rp.id,
							roundId: rp.roundId,
							playerId: rp.playerId,
							teamId: rp.teamId,
							scoreAfterRound: rp.scoreAfterRound,
						})) || [],
				})) || [],

			participants:
				orm.participants?.map((p) => ({
					id: p.id,
					userId: p.userId,
					name: p.name,
					teamId: p.team?.id || "",
					finalScore: p.finalScore,
				})) || [],
		};

		return HistoryGameEntity.fromPrimitives(state);
	}

	static toOrm(domain: HistoryGameEntity): HistoryGameOrmEntity {
		const primitives = domain.toPrimitives();
		const orm = new HistoryGameOrmEntity();

		orm.id = primitives.id;
		orm.ownerId = primitives.ownerId;
		orm.status = primitives.status;
		orm.winnerTeamId = primitives.winnerTeamId;
		orm.settings = primitives.settings;
		orm.teamsFinalState = primitives.teamsFinalState;
		orm.playersFinalState = primitives.playersFinalState;
		orm.createdAt = primitives.createdAt;
		orm.updatedAt = primitives.updatedAt;

		orm.teams = primitives.teams.map((t) => {
			const teamOrm = new HistoryTeamOrmEntity();
			teamOrm.id = t.id;
			teamOrm.name = t.name;
			return teamOrm;
		});

		orm.rounds = primitives.rounds.map((r) => {
			const roundOrm = new HistoryRoundOrmEntity();
			roundOrm.id = r.id;
			roundOrm.gameId = r.gameId;
			roundOrm.teamId = r.teamId;
			roundOrm.guesserId = r.guesserId;
			roundOrm.words = r.words;
			roundOrm.roundNumber = r.roundNumber;

			roundOrm.participants = r.participants.map((rp) => {
				const rpOrm = new HistoryRoundParticipantOrmEntity();
				rpOrm.id = rp.id;
				rpOrm.roundId = rp.roundId;
				rpOrm.playerId = rp.playerId;
				rpOrm.teamId = rp.teamId;
				rpOrm.scoreAfterRound = rp.scoreAfterRound;
				return rpOrm;
			});

			return roundOrm;
		});

		orm.participants = primitives.participants.map((p) => {
			const participantOrm = new HistoryParticipantOrmEntity();
			participantOrm.id = p.id;
			participantOrm.userId = p.userId;
			participantOrm.name = p.name;

			participantOrm.team = { id: p.teamId } as HistoryTeamOrmEntity;

			participantOrm.finalScore = p.finalScore;
			return participantOrm;
		});

		return orm;
	}
}

export class HistoryRoundMapper {
	static toDomain(orm: HistoryRoundOrmEntity): HistoryRoundEntity {
		return HistoryRoundEntity.fromPrimitives({
			id: orm.id,
			gameId: orm.gameId,
			teamId: orm.teamId,
			guesserId: orm.guesserId,
			words: orm.words,
			roundNumber: orm.roundNumber,
			participants:
				orm.participants?.map((rp) => ({
					id: rp.id,
					roundId: rp.roundId,
					playerId: rp.playerId,
					teamId: rp.teamId,
					scoreAfterRound: rp.scoreAfterRound,
				})) || [],
		});
	}

	static toOrm(domain: HistoryRoundEntity): HistoryRoundOrmEntity {
		const primitives = domain.toPrimitives();
		const orm = new HistoryRoundOrmEntity();

		orm.id = primitives.id;
		orm.gameId = primitives.gameId;
		orm.teamId = primitives.teamId;
		orm.guesserId = primitives.guesserId;
		orm.words = primitives.words;
		orm.roundNumber = primitives.roundNumber;

		orm.participants = primitives.participants.map((rp) => {
			const rpOrm = new HistoryRoundParticipantOrmEntity();
			rpOrm.id = rp.id;
			rpOrm.roundId = rp.roundId;
			rpOrm.playerId = rp.playerId;
			rpOrm.teamId = rp.teamId;
			rpOrm.scoreAfterRound = rp.scoreAfterRound;
			return rpOrm;
		});

		return orm;
	}
}
