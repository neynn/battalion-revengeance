import { CameraHelper } from "../camera/cameraHelper.js";
import { BattalionActor } from "./battalionActor.js";
import { Player } from "./player.js";

const ACTOR_TYPE = {
    PLAYER: "Player",
    OTHER_PLAYER: "OtherPlayer",
    AI: "AI"
};

export const ActorSpawner = {
    createAI: function(gameContext, commanderType, teamName) {
        const { world } = gameContext;
        const { turnManager } = world;
        const actor = turnManager.createActor((actorID, actorType) => {
            const actorObject = new BattalionActor(actorID);

            actorObject.setConfig(actorType);
            actorObject.setTeam(teamName);

            return actorObject;
        }, ACTOR_TYPE.AI);

        actor.loadCommander(gameContext, commanderType);

        return actor;
    },
    createPlayer: function(gameContext, commanderType, teamName) {
        const { world } = gameContext;
        const { turnManager } = world;
        const actor = turnManager.createActor((actorID, actorType) => {
            const context = CameraHelper.createPlayCamera(gameContext);
            const camera = context.getCamera();
            const actorObject = new Player(actorID, camera);

            actorObject.setConfig(actorType);
            actorObject.setTeam(teamName);
            camera.addPerspective(teamName);
            camera.setMainPerspective(teamName);

            return actorObject;
        }, ACTOR_TYPE.PLAYER);

        actor.loadCommander(gameContext, commanderType);
        actor.loadKeybinds(gameContext);
        actor.states.setNextState(gameContext, Player.STATE.IDLE);

        return actor;
    }
};