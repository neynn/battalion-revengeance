import { CameraHelper } from "../camera/cameraHelper.js";
import { BattalionActor } from "./battalionActor.js";
import { Player } from "./player.js";

const ACTOR_TYPE = {
    PLAYER: "Player",
    OTHER_PLAYER: "OtherPlayer",
    AI: "AI"
};

export const ActorSpawner = {
    createAI: function(gameContext, config, customID) {
        const { world, teamManager } = gameContext;
        const { turnManager } = world;
        const { type, id, team } = config;
        const teamObject = teamManager.getTeam(team);

        if(!teamObject || teamObject.hasActor()) {
            console.log(`Team ${team} does not exist!`);
            return null;
        }

        const actor = turnManager.createActor((actorID, actorType) => {
            const actorObject = new BattalionActor(actorID);

            teamObject.setActor(actorID);
            actorObject.setConfig(actorType);
            actorObject.setTeam(team);
            actorObject.setCustomID(customID);

            return actorObject;
        }, ACTOR_TYPE.AI, id);

        actor.loadNarrator(gameContext, type);

        return actor;
    },
    createPlayer: function(gameContext, config, customID) {
        const { world, teamManager } = gameContext;
        const { turnManager } = world;
        const { type, id, team } = config;
        const teamObject = teamManager.getTeam(team);

        if(!teamObject || teamObject.hasActor()) {
            console.log(`Team ${team} does not exist!`);
            return null;
        }

        const actor = turnManager.createActor((actorID, actorType) => {
            const context = CameraHelper.createPlayCamera(gameContext);
            const camera = context.getCamera();
            const actorObject = new Player(actorID, camera);

            teamObject.setActor(actorID);
            actorObject.setConfig(actorType);
            actorObject.setTeam(team);
            actorObject.setCustomID(customID);
            camera.addPerspective(team);

            return actorObject;
        }, ACTOR_TYPE.PLAYER, id);

        actor.loadNarrator(gameContext, type);
        actor.loadKeybinds(gameContext);
        actor.states.setNextState(gameContext, Player.STATE.IDLE);

        return actor;
    }
};