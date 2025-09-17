import { Cursor } from "../../engine/client/cursor.js";
import { Player } from "../actors/player/player.js";
import { OtherPlayer } from "../actors/otherPlayer.js";
import { EnemyActor } from "../actors/enemyActor.js";
import { CameraContext } from "../../engine/camera/cameraContext.js";
import { ArmyContext } from "../armyContext.js";
import { DefaultTypes } from "../defaultTypes.js";
import { ACTOR_ID } from "../enums.js";
import { Actor } from "../../engine/turn/actor.js";
import { MapManager } from "../../engine/map/mapManager.js";
import { DebugSystem } from "./debug.js";
import { PlayCamera } from "../camera/playCamera.js";
import { MissionHandler } from "../actors/player/mission/missionHandler.js";
import { ArmyEventHandler } from "../armyEventHandler.js";
import { MissionCompleteEvent } from "../events/missionComplete.js";
import { ContextHelper } from "../../engine/camera/contextHelper.js";

const ACTOR_TYPE = {
    PLAYER: "Player",
    ENEMY: "Enemy",
    OTHER_PLAYER: "OtherPlayer"
};

const createPlayerCamera = function(gameContext) {
    const { renderer, transform2D } = gameContext;
    const { tileWidth, tileHeight } = transform2D;

    const camera = new PlayCamera();
    const context = renderer.createContext("PLAYER_CAMERA", camera);

    context.setPositionMode(CameraContext.POSITION_MODE.AUTO_CENTER);
    context.setDisplayMode(CameraContext.DISPLAY_MODE.RESOLUTION_FIXED);
    context.setScaleMode(CameraContext.SCALE_MODE.WHOLE);
    context.setResolution(560, 560);

    camera.bindViewport();
    camera.setTileSize(tileWidth, tileHeight);

    return camera;
}

const createPlayer = function(gameContext, actorID, team, type) {
    const { client, world } = gameContext;
    const { turnManager, entityManager, mapManager, eventBus } = world;
    const { router, cursor } = client;

    const actorType = turnManager.getActorType(type);
    const camera = createPlayerCamera(gameContext);
    const actor = new Player(actorID, camera);

    camera.initCustomLayers(gameContext);

    actor.teamID = team ?? null;
    actor.inventory.init(gameContext);
    actor.hover.createSprite(gameContext);
    actor.setConfig(actorType);

    actor.missions.events.on(MissionHandler.EVENT.MISSION_COMPLETE, (missionID, mission) => {
        eventBus.emit(ArmyEventHandler.TYPE.MISSION_COMPLETE, MissionCompleteEvent.createEvent(missionID, mission, actorID));
    });

    mapManager.events.on(MapManager.EVENT.MAP_ENABLE, (mapID, worldMap) => {
        actor.onMapEnable(gameContext, mapID, worldMap);
    });

    cursor.events.on(Cursor.EVENT.BUTTON_DRAG, (buttonID, deltaX, deltaY) => {
        if(buttonID === Cursor.BUTTON.LEFT) {
            const context = ContextHelper.getContextAtMouse(gameContext);

            if(context) {
                context.dragCamera(deltaX, deltaY);
            }
        }
    });

    router.bind(gameContext, "PLAY");
    router.on(Player.COMMAND.TOGGLE_RANGE, () => actor.toggleRange(gameContext));
    router.on(Player.COMMAND.CLICK, () => actor.onClick(gameContext));
    router.on("ESCAPE", () => gameContext.states.setNextState(gameContext, ArmyContext.STATE.MAIN_MENU));
    router.on("DEBUG_IDLE", () => actor.states.setNextState(gameContext, Player.STATE.IDLE));
    router.on("DEBUG_HEAL", () => actor.states.setNextState(gameContext, Player.STATE.HEAL));
    router.on("DEBUG_FIREMISSION", () => actor.states.setNextState(gameContext, Player.STATE.FIRE_MISSION, {
        "missionID": "OrbitalLaser",
        "transaction": DefaultTypes.createItemTransaction("Resource", "Gold", 500)
    }));
    router.on("DEBUG_SELL", () => actor.states.setNextState(gameContext, Player.STATE.SELL));
    router.on("DEBUG_PLACE", () => actor.states.setNextState(gameContext, Player.STATE.PLACE, {
        "entityType": entityManager.getEntityType("blue_commando"),
        "transaction": DefaultTypes.createItemTransaction("Resource", "Gold", 500)
    }));
    router.on("DEBUG_LOAD", () => DebugSystem.spawnFullEntities(gameContext));
    router.on("DEBUG_KILL", () => DebugSystem.killAllEntities(gameContext));
    router.on("DEBUG_DEBUG", () => actor.states.setNextState(gameContext, Player.STATE.DEBUG));

    return actor;
}

const createActor = function(gameContext, actorID, team, type) {
    switch(type) {
        case ACTOR_TYPE.PLAYER: return createPlayer(gameContext, actorID, team, type);
        case ACTOR_TYPE.ENEMY: return new EnemyActor(actorID);
        case ACTOR_TYPE.OTHER_PLAYER: return new OtherPlayer(actorID);
        default: return new Actor(actorID);
    }
}

/**
 * Collection of functions revolving around the actors.
 */
export const ActorSystem = function() {}

/**
 * Creates and actor based on the config.
 *  
 * @param {*} gameContext 
 * @param {string} actorID 
 * @param {*} config 
 * @returns 
 */
ActorSystem.createActor = function(gameContext, actorID, config) {
    const { world } = gameContext;
    const { turnManager } = world;
    const { team, type } = config;
    const actor = createActor(gameContext, actorID, team, type);

    turnManager.addActor(actorID, actor);

    return actor;
}

/**
 * Creates the stories player actor.
 * 
 * @param {*} gameContext 
 * @param {string} team 
 * @returns 
 */
ActorSystem.createStoryPlayer = function(gameContext, teamID) {
    const { world } = gameContext;
    const { turnManager } = world;
    const actor = createActor(gameContext, ACTOR_ID.STORY_PLAYER, teamID, ACTOR_TYPE.PLAYER);

    turnManager.addActor(ACTOR_ID.STORY_PLAYER, actor);

    return actor;
}

/**
 * Creates the stories enemy actor.
 * 
 * @param {*} gameContext 
 * @param {string} teamID 
 * @returns 
 */
ActorSystem.createStoryEnemy = function(gameContext, teamID) {
    const { world } = gameContext;
    const { turnManager } = world;
    const actor = createActor(gameContext, ACTOR_ID.STORY_ENEMY, teamID, ACTOR_TYPE.ENEMY);

    turnManager.addActor(ACTOR_ID.STORY_ENEMY, actor);

    return actor;
}