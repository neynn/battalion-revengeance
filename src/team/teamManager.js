import { Team } from "./team";

export const TeamManager = function() {
    this.nextID = 0;
    this.teams = [];
}

TeamManager.prototype.createTeam = function() {
    const teamID = this.nextID++;
    const team = new Team(teamID);

    this.teams.push(team);

    return team;
}