import { GameError } from "../../modules/game/domain/errors/game.errors";

export class TeamNotFoundError extends GameError {
    constructor(teamId: string) {
        super(`Team with ID ${teamId} not found`);
    }
}
export class PlayerAlreadyInTeamError extends GameError {
    constructor() {
        super("Player is already in a team");
    }
}
