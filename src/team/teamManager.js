import { EventEmitter } from "../../engine/events/eventEmitter.js";
import { Team } from "./team.js";

export const TeamManager = function() {
    this.teams = new Map();
    this.activeTeams = [];

    this.events = new EventEmitter();
    this.events.register(TeamManager.EVENT.TEAM_LOST);
    this.events.register(TeamManager.EVENT.TEAM_WON);
}

TeamManager.EVENT = {
    TEAM_LOST: 0,
    TEAM_WON: 1
};

TeamManager.prototype.exit = function() {
    this.teams.clear();
}

TeamManager.prototype.createTeam = function(teamID) {
    if(this.teams.has(teamID)) {
        console.log("Team creation failed!")
        return null;
    }

    const team = new Team(teamID);

    this.teams.set(teamID, team);

    return team;
}

TeamManager.prototype.getTeam = function(teamID) {
    const team = this.teams.get(teamID);

    if(!team) {
        return null;
    }

    return team;
}

TeamManager.prototype.isEnemy = function(teamA, teamB) {
    const mainTeam = this.teams.get(teamA);

    if(mainTeam) {
        const checkTeam = this.teams.get(teamB);

        if(checkTeam) {
            return checkTeam.isEnemy(teamA);
        }
    }

    return false;
}

TeamManager.prototype.isAlly = function(teamA, teamB) {
    const mainTeam = this.teams.get(teamA);

    if(mainTeam) {
        const checkTeam = this.teams.get(teamB);

        if(checkTeam) {
            return checkTeam.isAlly(teamA);
        }
    }

    return false;
}

TeamManager.prototype.removeActiveTeam = function(teamID) {
    for(let i = 0; i < this.activeTeams.length; i++) {
        if(this.activeTeams[i] === teamID) {
            this.activeTeams[i] = this.activeTeams[this.activeTeams.length - 1];
            this.activeTeams.pop();
            this.events.emit(TeamManager.EVENT.TEAM_LOST, teamID);
            break;
        }
    }
}

TeamManager.prototype.checkWinner = function(gameContext) {
    switch(this.activeTeams.length) {
        case 0: {
            //No team remaining. This is a draw.
            break;
        }
        case 1: {
            const winner = this.activeTeams[0];
            //Only team remaining. They must be the winner.
            break;
        }   
        default: {
            //More than two teams remaining. Check if they are allies?
            break;
        }
    }
}

TeamManager.prototype.onEntityDestroy = function(gameContext, entity) {
    const entityID = entity.getID();

    for(const [teamID, team] of this.teams) {
        team.removeEntity(entityID);
        team.updateStatus();

        if(team.isLoser()) {
            this.removeActiveTeam(teamID);
        }
    }

    this.checkWinner(gameContext);
}
