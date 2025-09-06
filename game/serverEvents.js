import { CLIENT_EVENT } from "./enums.js";
import { ActorSystem } from "./systems/actor.js";
import { MapSystem } from "./systems/map.js";
import { SpawnSystem } from "./systems/spawn.js";

export const ServerEvents = {};

ServerEvents.instanceGame = async function(gameContext, payload) {
    const { client } = gameContext;
    const { socket } = client;
    const { actors, entities, mapID, mapData, playerID } = payload;

    /* Actor Instancing */
    for(let i = 0; i < actors.length; i++) {
        const { actorID, actorSetup } = actors[i];

        ActorSystem.createActor(gameContext, actorID, actorSetup);
    }

    /* Map-Instancing */
    if(!mapData) {
        const worldMap = await MapSystem.createMapByID(gameContext, mapID);

        if(!worldMap) {
            socket.messageRoom(CLIENT_EVENT.INSTANCE_MAP, { "success": false, "error": "NO_MAP_FILE" });
        } else {
            socket.messageRoom(CLIENT_EVENT.INSTANCE_MAP, { "success": true, "error": null }); 
        }
    } else {
        MapSystem.createMapByData(gameContext, mapID, mapData);

        socket.messageRoom(CLIENT_EVENT.INSTANCE_MAP, { "success": true, "error": null });
    }

    for(let i = 0; i < entities.length; i++) {
        const setup = entities[i];

        SpawnSystem.createEntity(gameContext, setup);
    }
}

ServerEvents.instanceActor = function(gameContext, payload) {
    const { actorID, actorSetup } = payload;

    ActorSystem.createActor(gameContext, actorID, actorSetup);
}

ServerEvents.instanceEntityBatch = function(gameContext, payload) {
    const { entityBatch } = payload;
    
    for(let i = 0; i < entityBatch.length; i++) {
        const setup = entityBatch[i];

        SpawnSystem.createEntity(gameContext, setup);
    }
}

ServerEvents.instanceMapFromData = function(gameContext, payload) {
    const { client } = gameContext;
    const { socket } = client;
    const { mapID, mapData } = payload;

    MapSystem.createMapByData(gameContext, mapID, mapData);

    socket.messageRoom(CLIENT_EVENT.INSTANCE_MAP, {
        "success": true,
        "error": null
    });
}

ServerEvents.instanceMapFromID = async function(gameContext, payload) {
    const { client } = gameContext;
    const { socket } = client;
    const { mapID } = payload;
    const worldMap = await MapSystem.createMapByID(gameContext, mapID);

    if(!worldMap) {
        socket.messageRoom(CLIENT_EVENT.INSTANCE_MAP, {
            "success": false,
            "error": "NO_MAP_FILE"
        });
    } else {
        socket.messageRoom(CLIENT_EVENT.INSTANCE_MAP, {
            "success": true,
            "error": null
        }); 
    }
}

ServerEvents.roomUpdate = function(gameContext, payload) {
    console.log(payload);
}

ServerEvents.gameEvent = function(gameContext, payload) {
    const { world } = gameContext;
    const { eventBus } = world;
    const { type, data } = payload;

    /*
        TODO: FOR SERVER!
        When the server sends an action, it sends it as CLIENT_EVENT.EVENT { ACTION_AUTHORIZE { "choice": executionRequest, "actorID": messengerID } }
        const { executionRequest } = payload;
        const { messengerID } = executionRequest;

        eventBus.emit(ArmyEventHandler.TYPE.ACTION_AUTHORIZE, { "choice": executionRequest, "actorID": messengerID });

        So force the eventBus to call ACTION_AUTHORIZE with the parameters.
    */

    eventBus.emit(type, data);
}