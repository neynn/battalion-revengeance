import { EventEmitter } from "../../engine/events/eventEmitter.js";
import { Team } from "./team.js";

export const TeamManager = function() {
    this.teams = new Map();
    this.activeTeams = [];
    this.isConcluded = false;

    this.events = new EventEmitter();
    this.events.register(TeamManager.EVENT.TEAM_LOST);
    this.events.register(TeamManager.EVENT.TEAM_WON);
    this.events.register(TeamManager.EVENT.ALLIANCE_WON);
    this.events.register(TeamManager.EVENT.DRAW);

    this.events.on(TeamManager.EVENT.TEAM_LOST, (id) => console.log("TEAM LOST!", id));
    this.events.on(TeamManager.EVENT.TEAM_WON, (id) => console.log("TEAM WON!", id));
    this.events.on(TeamManager.EVENT.ALLIANCE_WON, (alliance) => console.log("ALLIANCE_WON!", alliance));
    this.events.on(TeamManager.EVENT.DRAW, () => console.log("DRAW!"));
}

TeamManager.EVENT = {
    TEAM_LOST: "TEAM_LOST",
    TEAM_WON: "TEAM_WON",
    ALLIANCE_WON: "ALLIANCE_WON",
    DRAW: "DRAW"
};

TeamManager.prototype.exit = function() {
    this.teams.clear();
    this.activeTeams.length = 0;
    this.isConcluded = false;
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

TeamManager.prototype.isAlly = function(teamA, teamB) {
    const team = this.teams.get(teamA);

    if(team) {
        return team.isAlly(teamB);
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

TeamManager.prototype.allActiveAllied = function() {
    if(this.activeTeams.length === 0) {
        return false;
    }

    const mainTeam = this.getTeam(this.activeTeams[0]);

    for(let i = 1; i < this.activeTeams.length; i++) {
        if(!mainTeam.isAlly(this.activeTeams[i])) {
            return false;
        }
    }

    return true;
}

TeamManager.prototype.getFirstWinner = function() {
    for(let i = 0; i < this.activeTeams.length; i++) {
        const team = this.getTeam(this.activeTeams[i]);
        const { status } = team;

        if(status === Team.STATUS.WINNER) {
            return this.activeTeams[i];
        }
    }

    return null;
}

TeamManager.prototype.checkWinner = function() {
    switch(this.activeTeams.length) {
        case 0: {
            this.isConcluded = true;
            this.events.emit(TeamManager.EVENT.DRAW);
            break;
        }
        case 1: {
            this.isConcluded = true;
            this.events.emit(TeamManager.EVENT.TEAM_WON, this.activeTeams[0]);
            break;
        }
        default: {
            if(this.allActiveAllied()) {
                this.isConcluded = true;
                this.events.emit(TeamManager.EVENT.ALLIANCE_WON, this.activeTeams);
            } else {
                const firstWinner = this.getFirstWinner();

                if(firstWinner !== null) {
                    this.isConcluded = true;
                    this.events.emit(TeamManager.EVENT.TEAM_WON, firstWinner);
                }
            }

            break;
        }
    }
}

TeamManager.prototype.updateStatus = function(gameContext) {
    if(this.isConcluded) {
        return;
    }

    const losers = [];

    for(let i = 0; i < this.activeTeams.length; i++) {
        const teamID = this.activeTeams[i];
        const team = this.getTeam(teamID);
        const status = team.updateStatus();

        if(status === Team.STATUS.LOSER) {
            losers.push(teamID);
        }
    }

    for(let i = 0; i < losers.length; i++) {
        const loserID = losers[i];

        this.removeActiveTeam(loserID);
    }

    if(losers.length !== 0) {
        this.updateOrder(gameContext);
    }

    this.checkWinner();
}

TeamManager.prototype.updateOrder = function(gameContext) {
    const { world } = gameContext;
    const { turnManager } = world;
    const order = [];

    for(let i = 0; i < this.activeTeams.length; i++) {
        const teamID = this.activeTeams[i];
        const team = this.getTeam(teamID);
        const { actor } = team;

        order.push(actor);
    }

    if(order.length > 1) {
        turnManager.setActorOrder(order);
    }
}

TeamManager.prototype.onEntityMove = function(gameContext, entity) {
    for(let i = 0; i < this.activeTeams.length; i++) {
        const teamID = this.activeTeams[i];
        const team = this.getTeam(teamID);

        team.runObjectives((objective) => objective.onMove(gameContext, entity, teamID));
    }

    this.updateStatus(gameContext);
}

TeamManager.prototype.onEntityDeath = function(gameContext, entity) {
    const entityID = entity.getID();

    for(let i = 0; i < this.activeTeams.length; i++) {
        const teamID = this.activeTeams[i];
        const team = this.getTeam(teamID);

        team.removeEntity(entityID);
        team.runObjectives((objective) => objective.onDeath(gameContext, entity, teamID));
    }

    this.updateStatus(gameContext);
}

TeamManager.prototype.onTurnEnd = function(gameContext, teamID, currentTurn) {
    const team = this.getTeam(teamID);

    if(team) {
        team.runObjectives((objective) => objective.onTurnEnd(gameContext, currentTurn, teamID));
    }

    this.updateStatus(gameContext);
}