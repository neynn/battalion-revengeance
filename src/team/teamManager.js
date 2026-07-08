import { MAX_TEAMS } from "../constants.js";
import { TEAM_STAT } from "../enums.js";
import { Team } from "./team.js";

export const TeamManager = function() {
    this.teams = [];
    this.alliances = new Uint8Array(MAX_TEAMS * MAX_TEAMS);
    this.activeTeams = [];
    this.currentIndex = 0;
    this.currentTeam = TeamManager.INVALID_ID;
    this.isConcluded = false;
    this.round = 0;
    this.turn = 0;

    for(let i = 0; i < MAX_TEAMS; i++) {
        this.teams[i] = new Team(i);
    }
} 

TeamManager.INVALID_ID = -1;

TeamManager.prototype.resetTeams = function() {
    for(let i = 0; i < MAX_TEAMS; i++) {
        this.teams[i].reset();
    }
}

TeamManager.prototype.exit = function() {
    this.resetTeams();
    this.activeTeams.length = 0;
    this.isConcluded = false;
    this.turn = 0;
    this.round = 0;
    this.currentTeam = TeamManager.INVALID_ID;
    this.alliances.fill(0);
    this.currentIndex = 0;
}

TeamManager.prototype.setAlliance = function(teamA, teamB) {
    if(teamA < 0 || teamA >= MAX_TEAMS || teamB < 0 || teamB >= MAX_TEAMS) {
        return false;
    }

    if(teamA === teamB) {
        return false;
    }

    this.alliances[teamA * MAX_TEAMS + teamB] = 1;
    this.alliances[teamB * MAX_TEAMS + teamA] = 1;
    
    return true;
}

TeamManager.prototype.isAlly = function(teamA, teamB) {
    if(teamA < 0 || teamA >= MAX_TEAMS || teamB < 0 || teamB >= MAX_TEAMS) {
        return false;
    }

    if(teamA === teamB) {
        return true;
    }

    return this.alliances[teamA * MAX_TEAMS + teamB] === 1;
}

TeamManager.prototype.isCurrent = function(teamID) {
    return this.currentTeam !== TeamManager.INVALID_ID && this.currentTeam === teamID;
}

TeamManager.prototype.getCurrentTeam = function() {
    if(this.currentTeam < 0 || this.currentTeam >= MAX_TEAMS) {
        return null;
    }

    return this.teams[this.currentTeam];
}

TeamManager.prototype.forEachTeam = function(onCall) {
    for(let i = 0; i < MAX_TEAMS; i++) {
        if(this.teams[i].isReserved) {
            onCall(this.teams[i]);
        }
    }
}

TeamManager.prototype.loadAlliance = function(alliance) {
    if(alliance.length < 1) {
        return;
    }

    const teamID = alliance[0];

    for(let i = 1; i < alliance.length; i++) {
        const allyID = alliance[i];

        this.setAlliance(teamID, allyID);
    }
}

TeamManager.prototype.allActiveAllied = function() {
    if(this.activeTeams.length === 0) {
        return false;
    }

    const mainTeamID = this.activeTeams[0];

    for(let i = 1; i < this.activeTeams.length; i++) {
        if(!this.isAlly(mainTeamID, this.activeTeams[i])) {
            return false;
        }
    }

    return true;
}

TeamManager.prototype.reserveTeam = function(teamID) {
    if(teamID < 0 || teamID >= MAX_TEAMS) {
        return null;
    }

    const team = this.teams[teamID];

    if(team.isReserved) {
        return null;
    }

    team.isReserved = true;

    this.activeTeams.push(teamID);

    return team;
}

TeamManager.prototype.getTeam = function(teamIndex) {
    if(teamIndex < 0 || teamIndex >= MAX_TEAMS) {
        return null;
    }

    return this.teams[teamIndex];
}

TeamManager.prototype.removeActiveTeam = function(teamID) {
    let index = 0;
    let isFound = false;

    for(let i = 0; i < this.activeTeams.length; i++) {
        if(this.activeTeams[i] !== teamID) {
            this.activeTeams[index++] = this.activeTeams[i];
        } else {
            isFound = true;
        }
    }

    if(isFound) {
        console.log("TEAM LOST!", teamID);

        this.activeTeams.length = index;
    }
}

TeamManager.prototype.updateActor = function(gameContext) {
    const { world } = gameContext;
    const { actorManager } = world;
    const { actors } = actorManager;

    if(this.currentTeam !== TeamManager.INVALID_ID) {
        for(const actor of actors) {
            if(actor.teamID === this.currentTeam) {
                actorManager.setCurrentActor(gameContext, actor.getID());
                break;
            }
        }
    }
}

TeamManager.prototype.startTurn = function() {
    if(this.currentTeam !== TeamManager.INVALID_ID) {
        this.teams[this.currentTeam].turn++;
    }

    for(let i = 0; i < this.activeTeams.length; i++) {
        this.teams[this.activeTeams[i]].addStatistic(TEAM_STAT.ROUNDS_TAKEN, 1);
    }
}

TeamManager.prototype.endTurn = function() {
    this.currentIndex++;

    if(this.currentIndex >= this.activeTeams.length) {
        this.currentIndex = 0;
        this.round++;
    }

    this.turn++;

    if(this.activeTeams.length !== 0) {
        this.currentTeam = this.activeTeams[this.currentIndex];
    } else {
        this.currentTeam = TeamManager.INVALID_ID;
    }
}

TeamManager.prototype.initialize = function() {
    this.turn = 1;
    this.round = 1;

    if(this.currentIndex < 0 || this.currentIndex >= this.activeTeams.length) {
        this.currentTeam = TeamManager.INVALID_ID;
    } else {
        this.currentTeam = this.activeTeams[this.currentIndex];
    }

}

TeamManager.prototype.loadFromSave = function(currentTeam, turn, round) {
    this.turn = turn;
    this.round = round;
    this.currentTeam = currentTeam;

    const index = this.activeTeams.indexOf(this.currentTeam);

    if(index !== -1) {
        this.currentIndex = index;
    }  
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
    const NO_WINNER = 0;
    const ONE_WINNER = 1;

    switch(this.activeTeams.length) {
        case NO_WINNER: {
            this.isConcluded = true;

            console.log("DRAW!");
            break;
        }
        case ONE_WINNER: {
            this.isConcluded = true;

            console.log("TEAM WON!", this.activeTeams[0]);
            break;
        }
        default: {
            if(this.allActiveAllied()) {
                this.isConcluded = true;

                console.log("ALLIANCE_WON!", this.activeTeams);
            } else {
                const firstWinner = this.getFirstWinner();

                if(firstWinner !== null) {
                    this.isConcluded = true;

                    console.log("TEAM WON!", firstWinner);
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
        const team = this.teams[i];

        team.updateStatus(gameContext);

        if(team.isLoser()) {
            losers.push(i);
        }
    }

    for(let i = 0; i < losers.length; i++) {
        const loserID = losers[i];

        this.removeActiveTeam(loserID);
    }

    if(losers.length !== 0) {
        //this.updateOrder(gameContext);
        //TODO: Emit LOSER event and update the turn order.
    }

    this.checkWinner();
}