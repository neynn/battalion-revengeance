import { TypeRegistry } from "../typeRegistry.js";
import { BattalionActor } from "./battalionActor.js";
import { Player } from "./player.js";

export const ActorSpawner = {
    createTeam: function(gameContext, teamID, config) {
        const { teamManager } = gameContext;
        const { color = TypeRegistry.SCHEMA_TYPE.RED, customColor } = config;
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
    createActor: function(gameContext, config) {
        const { world, teamManager } = gameContext;
        const { turnManager } = world;
        const { type, id, team } = config;
        const teamObject = teamManager.getTeam(team);

        if(!teamObject) {
            console.log(`Team ${team} does not exist!`);
            return null;
        }

        const actor = turnManager.createActor((actorID, actorType) => {
            const actorObject = new BattalionActor(actorID);

            actorObject.setTeam(team);
            teamObject.addActor(actorID);

            return actorObject;
        }, type, id);

        return actor;
    },
    createPlayer: function(gameContext, config) {
        const { world, teamManager } = gameContext;
        const { turnManager } = world;
        const { type, id, team } = config;
        const teamObject = teamManager.getTeam(team);

        if(!teamObject) {
            console.log(`Team ${team} does not exist!`);
            return null;
        }

        const player = turnManager.createActor((actorID, actorType) => {
            const actor = new Player(actorID, actorType);

            actor.setTeam(team);
            teamObject.addActor(actorID);

            return actor;
        }, type, id);
        

        player.loadKeybinds(gameContext);

        return player;
    }
};