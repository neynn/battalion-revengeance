import { ArmyEventHandler } from "../armyEventHandler.js";
import { DEBRIS_TYPE, getTeamName } from "../enums.js";
import { DebrisRemovedEvent } from "../events/debrisRemoved.js";
import { ArmyMap } from "../init/armyMap.js";
import { AllianceSystem } from "./alliance.js";

/**
 * Collection of functions revolving around the debris.
 */
export const DebrisSystem = function() {}

/**
 * Checks if the debris is cleanable by the actor.
 * 
 * @param {*} gameContext 
 * @param {int} tileX 
 * @param {int} tileY 
 * @param {string} actorID 
 * @returns 
 */
DebrisSystem.isCleanable = function(gameContext, tileX, tileY, actorID) {
    const { world } = gameContext;
    const { mapManager, turnManager } = world;

    const actor = turnManager.getActor(actorID);

    if(!actor) {
        return false;
    }

    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return false;
    }

    const hasDebris = worldMap.hasDebris(tileX, tileY);

    if(!hasDebris) {
        return false;
    }

    const isOccupied = worldMap.isTileOccupied(tileX, tileY);

    if(isOccupied) {
        return false;
    }

    const teamID = worldMap.getTile(ArmyMap.LAYER.TEAM, tileX, tileY);
    const isEnemy = AllianceSystem.isEnemy(gameContext, actor.teamID, getTeamName(teamID));

    return !isEnemy;
}

/**
 * Gets executed after the cleaning action.
 * Removes debris and emits the DEBRIS_REMOVED event.
 * 
 * @param {*} gameContext 
 * @param {int} tileX 
 * @param {int} tileY 
 * @param {string} cleanerID 
 */
DebrisSystem.endCleaning = function(gameContext, tileX, tileY, cleanerID) {
    const { world } = gameContext;
    const { mapManager, eventBus } = world;
    const worldMap = mapManager.getActiveMap();

    worldMap.removeDebris(tileX, tileY);
    eventBus.emit(ArmyEventHandler.TYPE.DEBRIS_REMOVED, DebrisRemovedEvent.createEvent(tileX, tileY, cleanerID));
}

/**
 * Spawns debris at the locations specified in the array.
 * 
 * @param {*} gameContext 
 * @param {{x:int, y:int}[]} debris 
 * @returns 
 */
DebrisSystem.spawnDebris = function(gameContext, debris) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }

    for(let i = 0; i < debris.length; i++) {
        const { x, y } = debris[i];

        worldMap.addDebris(DEBRIS_TYPE.DEBRIS, x, y);
    }
}

/**
 * Checks if debris can spawn on the specified tile.
 * 
 * @param {*} gameContext 
 * @param {*} worldMap 
 * @param {int} tileX 
 * @param {int} tileY 
 * @returns 
 */
DebrisSystem.canDebrisSpawn = function(gameContext, worldMap, tileX, tileY) {
    const typeID = worldMap.getTile(ArmyMap.LAYER.TYPE, tileX, tileY);
    const tileType = gameContext.getTileType(typeID);

    if(!tileType.canDebrisSpawn) {
        return false;
    }

    if(!worldMap.hasDebris(tileX, tileY)) {
        if(worldMap.getTopEntity(tileX, tileY) === null) {
            if(!worldMap.isFullyClouded(tileX, tileY)) {
                return true;
            }
        }
    }
    
    return false;
}

/**
 * Returns a list of spawn locations for debris.
 * 
 * @param {*} gameContext 
 * @param {int} tileX 
 * @param {int} tileY 
 * @param {int} sizeX 
 * @param {int} sizeY 
 * @returns {{x:int,y:int}[]}
 */
DebrisSystem.getDebrisSpawnLocations = function(gameContext, tileX, tileY, sizeX, sizeY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const debris = [];

    if(!worldMap) {
        return debris;
    }
    
    const endX = tileX + sizeX;
    const endY = tileY + sizeY;

    for(let i = tileY; i < endY; i++) {
        for(let j = tileX; j < endX; j++) {
            const canSpawn = DebrisSystem.canDebrisSpawn(gameContext, worldMap, j, i);

            if(canSpawn) {
                debris.push({
                    "x": j,
                    "y": i
                });
            }
        }
    }

    return debris;
}