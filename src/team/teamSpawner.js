export const TeamSpawner = {
    createTeam: function(gameContext, teamID, config) {
        const { teamManager } = gameContext;
        const { 
            nation,
            faction,
            color,
            customColor
        } = config;
        const team = teamManager.createTeam(teamID);

        if(!team) {
            console.log("Team could not be created!");
            return null;
        }

        team.loadAsNation(gameContext, nation);
        team.loadAsFaction(gameContext, faction);

        if(customColor) {
            team.setCustomColor(customColor);
        } else if(color) {
            team.setColor(gameContext, color);
        }

        return team;
    },
    getActorID: function(gameContext, customActorID) {
        const { world } = gameContext;
        const { turnManager } = world;

        for(const [actorID, actor] of turnManager.actors) {
            const { customID } = actor;

            if(customID === customActorID) {
                return actorID;
            }
        }

        return null;
    } 
};