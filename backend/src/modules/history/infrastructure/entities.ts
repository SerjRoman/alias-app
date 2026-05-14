import {
	Entity,
	PrimaryColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	OneToMany,
	UpdateDateColumn,
} from "typeorm";
import { type GameSettings } from "../../game/domain/entities/game.entity";
import { PlayerState } from "../../game/domain/entities/player.entity";
import { WordState } from "../../game/domain/entities/round.entity";
import { TeamState } from "../../game/domain/entities/team.entity";

@Entity("history_games")
export class HistoryGameOrmEntity {
	@PrimaryColumn()
	id: string;
	@Column({ type: "text", nullable: true })
	ownerId: string | null;

	@Column()
	status: string;

	@Column({ type: "text", nullable: true })
	winnerTeamId: string | null;

	@Column("jsonb")
	settings: GameSettings;

	@Column("jsonb")
	teamsFinalState: TeamState[];

	@Column("jsonb")
	playersFinalState: PlayerState[];

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@OneToMany(() => HistoryRoundOrmEntity, (round) => round.game, {
		cascade: true,
	})
	rounds: HistoryRoundOrmEntity[];

	@OneToMany(
		() => HistoryParticipantOrmEntity,
		(participant) => participant.game,
		{ cascade: true },
	)
	participants: HistoryParticipantOrmEntity[];

	@OneToMany(() => HistoryTeamOrmEntity, (team) => team.game, {
		cascade: true,
	})
	teams: HistoryTeamOrmEntity[];
}

@Entity("history_rounds")
export class HistoryRoundOrmEntity {
	@PrimaryColumn()
	id: string;

	@ManyToOne(() => HistoryGameOrmEntity, (game) => game.rounds)
	game: HistoryGameOrmEntity;

	@Column() gameId: string;
	@Column() teamId: string;
	@Column() guesserId: string;

	@Column("jsonb")
	words: WordState[];

	@Column() roundNumber: number;

	@OneToMany(
		() => HistoryRoundParticipantOrmEntity,
		(participant) => participant.round,
		{
			cascade: true,
		},
	)
	participants: HistoryRoundParticipantOrmEntity[];
}

@Entity("history_round_participants")
export class HistoryRoundParticipantOrmEntity {
	@PrimaryColumn()
	id: string;
	@ManyToOne(() => HistoryRoundOrmEntity, (round) => round.participants)
	round: HistoryRoundOrmEntity;
	@Column() roundId: string;
	@Column({ type: "text", nullable: true }) playerId: string | null;
	@Column() teamId: string;
	@Column() scoreAfterRound: number;
}

@Entity("history_teams")
export class HistoryTeamOrmEntity {
	@PrimaryColumn()
	id: string;
	@Column()
	name: string;
	@ManyToOne(() => HistoryGameOrmEntity, (game) => game.teams)
	game: HistoryGameOrmEntity;

	@OneToMany(() => HistoryParticipantOrmEntity, (player) => player.team, {
		cascade: true,
	})
	players: HistoryParticipantOrmEntity[];
}

@Entity("history_participants")
export class HistoryParticipantOrmEntity {
	@PrimaryColumn()
	id: string;

	@ManyToOne(() => HistoryGameOrmEntity, (game) => game.participants)
	game: HistoryGameOrmEntity;

	@Column({ type: "text", nullable: true })
	userId: string | null;

	@Column()
	name: string;

	@ManyToOne(() => HistoryTeamOrmEntity, (team) => team.players)
	team: HistoryTeamOrmEntity;

	@Column()
	finalScore: number;
}
