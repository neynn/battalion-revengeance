import { TeamManager } from "../team/teamManager.js";

export const createTurnSnapshot = function() {
    return {
        "team": TeamManager.INVALID_ID,
        "rounds": 0,
        "turns": 0
    }
}

export const fillTurnSnapshot = function(gameContext) {
    const { teamManager } = gameContext;
    const { turn, round, currentTeam } = teamManager;
    const snapshot = createTurnSnapshot();

    snapshot.rounds = round;
    snapshot.turns = turn;
    snapshot.team = currentTeam;

    return snapshot;
}