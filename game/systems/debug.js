import { DefaultTypes } from "../defaultTypes.js";
import { ArmyEventHandler } from "../armyEventHandler.js";
import { SpawnSystem } from "./spawn.js";
import { EntityDeathEvent } from "../events/entityDeath.js";
import { ACTOR_ID, DEBRIS_TYPE, TEAM_NAME } from "../enums.js";

/**
 * Collection of functions revolving around debugging.
 */
export const DebugSystem = function() {}

/**
 * Emits a death event for all entities.
 * 
 * @param {*} gameContext 
 */
DebugSystem.killAllEntities = function(gameContext) {
    const { world } = gameContext;
    const { entityManager, eventBus } = world;

    entityManager.forAllEntities((entity) => eventBus.emit(ArmyEventHandler.TYPE.ENTITY_DEATH, EntityDeathEvent.createEvent(entity.getID(), "DEBUG")));
}

/**
 * Spawns an entity for every tile of the map.
 * 
 * @param {*} gameContext 
 * @returns 
 */
DebugSystem.spawnFullEntities = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }

    const { width, height } = worldMap;

    for(let i = 0; i < height; i++) {
        for(let j = 0; j < width; j++) {
            //SpawnSystem.createEntity(gameContext, DefaultTypes.createSpawnConfig("red_battletank", TEAM_NAME.CRIMSON, [], j, i));
            SpawnSystem.createEntity(gameContext, DefaultTypes.createSpawnConfig("blue_landingzone", TEAM_NAME.ALLIES, ACTOR_ID.STORY_PLAYER, j, i));  
        }
    }
}

/**
 * Spawns a debris on every tile of the map.
 * 
 * @param {*} gameContext 
 * @returns 
 */
DebugSystem.spawnFullDebris = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }

    const { width, height } = worldMap;

    for(let i = 0; i < height; i++) {
        for(let j = 0; j < width; j++) {
            worldMap.addDebris(DEBRIS_TYPE.DEBRIS, j, i);
        }
    }
}