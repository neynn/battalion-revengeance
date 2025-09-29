import { TypeRegistry } from "../typeRegistry.js";

export const TeamSpawner = {
    createTeam: function(gameContext, teamID, config) {
        const { teamManager } = gameContext;
        const { 
            color = TypeRegistry.SCHEMA_TYPE.RED,
            customColor
        } = config;
        const team = teamManager.createTeam(teamID);

        if(!team) {
            console.log("Team could not be created!");
            return null;
        }

        if(customColor) {
            team.setCustomColor(customColor);
        } else {
            team.setColor(gameContext, color);
        }

        return team;
    },
};