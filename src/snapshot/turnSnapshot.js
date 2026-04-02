import { TeamManager } from "../team/teamManager.js";

export const createTurnSnapshot = function() {
    return {
        "team": TeamManager.INVALID_ID,
        "rounds": 0,
        "turns": 0
    }
}

export const fillTurnSnapshot = function(gameContext) {
    const { world, teamManager } = gameContext;
    const { turnManager } = world;
    const { globalTurn, globalRound } = turnManager;
    const snapshot = createTurnSnapshot();

    snapshot.rounds = globalRound;
    snapshot.turns = globalTurn;
    snapshot.team = teamManager.currentTeam;

    return snapshot;
}