import { MAX_TEAMS } from "../constants.js";
import { Team } from "./team.js";

export const TeamManager = function() {
    this.teams = [];
    this.alliances = new Uint8Array(MAX_TEAMS * MAX_TEAMS);
    this.nameMap = new Map();
    this.activeTeams = [];
    this.currentTeam = TeamManager.INVALID_ID;
    this.previousTeam = TeamManager.INVALID_ID;
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
    this.nameMap.clear();
    this.activeTeams.length = 0;
    this.isConcluded = false;
    this.turn = 0;
    this.round = 0;
    this.currentTeam = TeamManager.INVALID_ID;
    this.previousTeam = TeamManager.INVALID_ID;
    this.alliances.fill(0);
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

TeamManager.prototype.clearActive = function() {
    this.previousTeam = this.currentTeam;
    this.currentTeam = TeamManager.INVALID_ID;
}

TeamManager.prototype.setActive = function(teamID) {
    if(teamID < 0 || teamID >= MAX_TEAMS) {
        return;
    }

    if(!this.activeTeams.includes(teamID)) {
        return;
    }

    if(this.previousTeam === this.activeTeams[this.activeTeams.length - 1]) {
        this.round++;
    }

    this.turn++;
    this.currentTeam = teamID;
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

    const teamID = this.getTeamID(alliance[0]);

    for(let i = 1; i < alliance.length; i++) {
        const allyID = this.getTeamID(alliance[i]);

        this.setAlliance(teamID, allyID);
    }
}

TeamManager.prototype.reserveTeam = function(teamID, teamName) {
    if(teamID < 0 || teamID >= MAX_TEAMS) {
        return null;
    }

    const team = this.teams[teamID];

    if(team.isReserved) {
        return null;
    }

    team.isReserved = true;

    this.activeTeams.push(teamID);

    if(teamName !== null && !this.nameMap.has(teamName)) {
        this.nameMap.set(teamName, teamID);
    } else {
        console.error("Team name is null or already used!");
    }

    return team;
}

TeamManager.prototype.getTeamID = function(teamName) {
    const teamIndex = this.nameMap.get(teamName);

    if(teamIndex === undefined) {
        return TeamManager.INVALID_ID;
    }

    return teamIndex;
}

TeamManager.prototype.getTeam = function(teamIndex) {
    if(teamIndex < 0 || teamIndex >= MAX_TEAMS) {
        return null;
    }

    return this.teams[teamIndex];
}

//TODO(neyn): Clear of currentTeam.
TeamManager.prototype.removeActiveTeam = function(teamID) {
    for(let i = 0; i < this.activeTeams.length; i++) {
        if(this.activeTeams[i] === teamID) {
            this.activeTeams[i] = this.activeTeams[this.activeTeams.length - 1];
            this.activeTeams.pop();

            console.log("TEAM LOST!", teamID);
            break;
        }
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

TeamManager.prototype.updateStatus = function() {
    if(this.isConcluded) {
        return;
    }

    const losers = [];

    for(let i = 0; i < this.activeTeams.length; i++) {
        const team = this.teams[i];

        team.updateStatus();

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

TeamManager.prototype.getNextTeam = function() {
    if(this.activeTeams.length === 0) {
        return TeamManager.INVALID_ID;
    }

    const index = this.activeTeams.indexOf(this.previousTeam);
    const nextIndex = (index + 1) % this.activeTeams.length;

    return this.activeTeams[nextIndex];
}

TeamManager.prototype.updateActor = function(gameContext) {
    const { world } = gameContext;
    const { actorManager } = world;
    const { actors } = actorManager;
    let isFound = false;

    if(this.currentTeam !== TeamManager.INVALID_ID) {
        for(const actor of actors) {
            if(actor.teamID === this.currentTeam) {
                actorManager.setCurrentActor(gameContext, actor.getID());
                isFound = true;
                break;
            }
        }
    }

    if(!isFound) {
        actorManager.clearCurrentActor(gameContext);
    }
}