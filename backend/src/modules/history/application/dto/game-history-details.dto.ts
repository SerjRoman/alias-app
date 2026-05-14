import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import {
    TeamResponseDto,
    WordResponseDto,
} from "../../../game/application/dto/response";
import { GameSettingsDto } from "../../../game/application/dto/response/game-response.dto";

export class HistoryTeamDto {
    @ApiProperty({ example: "team-1" })
    @Expose()
    id: string;

    @ApiProperty({ example: "Team A" })
    @Expose()
    name: string;
}

export class HistoryParticipantDto {
    @ApiProperty({ example: "participant-1" })
    @Expose()
    id: string;

    @ApiProperty({ example: "user-1", nullable: true })
    @Expose()
    userId: string | null;

    @ApiProperty({ example: "Player 1" })
    @Expose()
    name: string;

    @ApiProperty({ example: "team-1" })
    @Expose()
    teamId: string;

    @ApiProperty({ example: 10 })
    @Expose()
    finalScore: number;
}

export class HistoryRoundParticipantDto {
    @ApiProperty({ example: "rp-1" })
    @Expose()
    id: string;

    @ApiProperty({ example: "round-1" })
    @Expose()
    roundId: string;

    @ApiProperty({ example: "player-1", nullable: true })
    @Expose()
    playerId: string | null;

    @ApiProperty({ example: "team-1" })
    @Expose()
    teamId: string;

    @ApiProperty({ example: 5 })
    @Expose()
    scoreAfterRound: number;
}

export class HistoryRoundDto {
    @ApiProperty({ example: "round-1" })
    @Expose()
    id: string;

    @ApiProperty({ example: "game-1" })
    @Expose()
    gameId: string;

    @ApiProperty({ example: "team-1" })
    @Expose()
    teamId: string;

    @ApiProperty({ example: "player-1" })
    @Expose()
    guesserId: string;

    @ApiProperty({
        description:
            "Words for the round with their status (e.g., guessed, skipped, etc.)",
        example: [{ word: "apple", status: "guessed" }],
        isArray: true,
        type: [WordResponseDto],
    })
    @Expose()
    words: WordResponseDto[];

    @ApiProperty({ example: 1 })
    @Expose()
    roundNumber: number;

    @ApiProperty({ type: [HistoryRoundParticipantDto] })
    @Expose()
    participants: HistoryRoundParticipantDto[];
}

export class GameHistoryDetailsResponseDto {
    @ApiProperty({ example: "game-1" })
    @Expose()
    id: string;

    @ApiProperty({ example: "user-1", nullable: true })
    @Expose()
    ownerId: string | null;

    @ApiProperty({ example: "completed" })
    @Expose()
    status: string;

    @ApiProperty({ example: "team-1", nullable: true })
    @Expose()
    winnerTeamId: string | null;

    @ApiProperty({
        description: "Game settings",
        example: { wordsToWin: 50, roundDuration: 60 },
        type: GameSettingsDto,
    })
    @Expose()
    settings: GameSettingsDto;

    @ApiProperty({
        description: "Final state of teams at the moment of game completion",
        isArray: true,
        type: [TeamResponseDto],
    })
    @Expose()
    teamsFinalState: TeamResponseDto[];

    @ApiProperty({
        description: "Final state of players at the moment of game completion",
        isArray: true,
        type: [HistoryParticipantDto],
    })
    @Expose()
    playersFinalState: HistoryParticipantDto[];

    @ApiProperty({ type: [HistoryTeamDto] })
    @Expose()
    teams: HistoryTeamDto[];

    @ApiProperty({ type: [HistoryParticipantDto] })
    @Expose()
    participants: HistoryParticipantDto[];

    @ApiProperty({ type: [HistoryRoundDto] })
    @Expose()
    rounds: HistoryRoundDto[];

    @ApiProperty()
    @Expose()
    createdAt: Date;

    @ApiProperty()
    @Expose()
    updatedAt: Date;
}
