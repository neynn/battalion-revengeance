import { TypeRegistry } from "../type/typeRegistry.js";

export const TeamSpawner = {
    createTeam: function(gameContext, teamID, config) {
        const { teamManager, typeRegistry } = gameContext;
        const { 
            type,
            color,
            customColor
        } = config;
        const team = teamManager.createTeam(teamID);

        if(!team) {
            console.log("Team could not be created!");
            return null;
        }

        const nationType = typeRegistry.getType(type, TypeRegistry.CATEGORY.NATION);

        if(nationType) {
            const { color } = nationType;

            team.setColor(gameContext, color);
            team.setNation(type);
        }

        if(customColor) {
            team.setCustomColor(customColor);
        } else if(color) {
            team.setColor(gameContext, color);
        }

        return team;
    },
};