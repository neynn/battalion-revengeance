import { Team } from "./team.js";

export const TeamManager = function() {
    this.teams = new Map();
}

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

TeamManager.prototype.onEntityDestroy = function(gameContext, teamID, entityID) {
    const team = this.teams.get(teamID);

    if(team) {
        team.removeEntity(entityID);
        team.updateStatus();

        if(team.isDefeated()) {
            //TODO: Implement.
            this.updateActingOrder(gameContext);
            console.log("TEAM has been defeated!");
        }
    }
}

TeamManager.prototype.updateActingOrder = function(gameContext) {
    //TODO: Implement.
}