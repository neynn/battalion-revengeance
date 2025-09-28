import { EventEmitter } from "../../engine/events/eventEmitter.js";
import { Team } from "./team.js";

export const TeamManager = function() {
    this.teams = new Map();
    this.activeTeams = [];
    this.winner = null;

    this.events = new EventEmitter();
    this.events.register(TeamManager.EVENT.TEAM_LOST);
    this.events.register(TeamManager.EVENT.TEAM_WON);
    this.events.register(TeamManager.EVENT.DRAW);

    this.events.on(TeamManager.EVENT.TEAM_LOST, (id) => console.log("TEAM LOST " + id));
    this.events.on(TeamManager.EVENT.TEAM_WON, (id) => console.log("TEAM WON " + id));
}

TeamManager.EVENT = {
    TEAM_LOST: "TEAM_LOST",
    TEAM_WON: "TEAM_WON",
    DRAW: "DRAW"
};

TeamManager.prototype.exit = function() {
    this.teams.clear();
    this.activeTeams.length = 0;
    this.winner = null;
}

TeamManager.prototype.createTeam = function(teamID) {
    if(this.teams.has(teamID)) {
        console.log("Team creation failed!")
        return null;
    }

    const team = new Team(teamID);

    this.teams.set(teamID, team);
    this.activeTeams.push(teamID);

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
    if(this.winner) {
        return;
    }

    switch(this.activeTeams.length) {
        case 0: {
            this.events.emit(TeamManager.EVENT.DRAW);
            break;
        }
        case 1: {
            this.setWinner(this.activeTeams[0]);
            break;
        }   
        default: {
            //More than two teams remaining. Check if they are allies?
            break;
        }
    }
}

TeamManager.prototype.setWinner = function(teamID) {
    if(this.winner === null) {
        this.winner = teamID;
        this.events.emit(TeamManager.EVENT.TEAM_WON, teamID);
    }
}

TeamManager.prototype.updateTeamStatus = function(team) {
    const teamID = team.getID();
    const status = team.updateStatus();

    switch(status) {
        case Team.STATUS.LOSER: {
            this.removeActiveTeam(teamID);
            break;
        }
        case Team.STATUS.WINNER: {
            this.setWinner(teamID);
            break;
        }
    }
}

TeamManager.prototype.onEntityDestroy = function(gameContext, entity) {
    const entityID = entity.getID();

    for(const [teamID, team] of this.teams) {
        team.removeEntity(entityID);
        team.handleDefeatObjective(gameContext, entity);

        this.updateTeamStatus(team);
    }

    this.checkWinner(gameContext);
}