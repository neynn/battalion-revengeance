import { BattalionActor } from "./battalionActor.js";
import { Player } from "./player.js";

export const ActorSpawner = {
    createActor: function(gameContext, config) {
        const { world, teamManager, portraitHandler } = gameContext;
        const { turnManager } = world;
        const { type, id, team } = config;
        const teamObject = teamManager.getTeam(team);

        if(!teamObject || teamObject.hasActor()) {
            console.log(`Team ${team} does not exist!`);
            return null;
        }

        const actor = turnManager.createActor((actorID, actorType) => {
            const { portrait } = actorType;
            const actorObject = new BattalionActor(actorID);

            actorObject.setTeam(team);
            teamObject.setActor(actorID);

            if(portrait) {
                actorObject.portrait = portraitHandler.getPortraitTexture(portrait);
            }

            return actorObject;
        }, type, id);

        return actor;
    },
    createPlayer: function(gameContext, config) {
        const { world, teamManager } = gameContext;
        const { turnManager } = world;
        const { type, id, team } = config;
        const teamObject = teamManager.getTeam(team);

        if(!teamObject || teamObject.hasActor()) {
            console.log(`Team ${team} does not exist!`);
            return null;
        }

        const player = turnManager.createActor((actorID, actorType) => {
            const actor = new Player(actorID, actorType);

            actor.setTeam(team);
            teamObject.setActor(actorID);

            return actor;
        }, type, id);
        

        player.loadKeybinds(gameContext);

        return player;
    }
};