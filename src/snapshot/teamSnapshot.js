import { TEAM_STAT } from "../enums.js";
import { Objective } from "../team/objective/objective.js";
import { Team } from "../team/team.js";

export const createTeamSnapshot = function() {
    const stats = [];

    for(let i = 0; i < TEAM_STAT._COUNT; i++) {
        stats[i] = 0;
    }

    return {
        "status": Team.STATUS.IDLE,
        "cash": 0,
        "stats": stats,
        "objectives": []
    }
}

export const createObjectiveSnapshot = function() {
    return {
        "status": Objective.STATUS.IDLE
    }
}