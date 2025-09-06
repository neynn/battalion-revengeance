import { WorldMap } from "../../engine/map/worldMap.js";
import { Player } from "../actors/player/player.js";
import { ArmyMap } from "../init/armyMap.js";

/**
 * Creates and returns a new ArmyMap
 * 
 * @param {string} id 
 * @param {{}} data 
 * @returns {ArmyMap}
 */
const createMap = function(gameContext, id, data, type) {
    const { world } = gameContext;
    const { turnManager } = world;
    const worldMap = new ArmyMap(id);

    worldMap.init(gameContext, data);

    if(data.data) {
        if(type) {
            worldMap.loadLayers(gameContext, data.data);
        } else {
            worldMap.loadLayersEmpty(gameContext, data.data);
        }
    }

    turnManager.forAllActors((actor) => {
        if(actor instanceof Player) {
            actor.onMapCreate(id, data);
        }
    });

    return worldMap;
}

/**
 * Collections of functions revolving around the world maps.
 */
export const MapSystem = function() {}

/**
 * Placed an entity on the current world map.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 */
MapSystem.placeEntity = function(gameContext, entity) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(worldMap) {
        worldMap.addEntity(entity.tileX, entity.tileY, entity.config.dimX, entity.config.dimY, entity.getID());
    }
}

/**
 * Removes an entity from the current world map.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 */
MapSystem.removeEntity = function(gameContext, entity) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(worldMap) {
        worldMap.removeEntity(entity.tileX, entity.tileY, entity.config.dimX, entity.config.dimY, entity.getID());
    }
}

/**
 * Creates a world map by specifying the id.
 * 
 * @param {*} gameContext 
 * @param {string} mapID 
 * @returns 
 */
MapSystem.createMapByID = async function(gameContext, mapID) {
    const { world } = gameContext;
    const { mapManager } = world;
    const mapData = await mapManager.fetchMapData(mapID);

    if(!mapData) {
        return null;
    }

    const worldMap = mapManager.createMap(mapID, (id) => createMap(gameContext, id, mapData, 1));

    mapManager.setActiveMap(mapID);

    return worldMap;
}

/**
 * Creates a world map by specifying the id and data.
 * 
 * @param {*} gameContext 
 * @param {string} mapID 
 * @param {{}} mapData 
 * @returns 
 */
MapSystem.createMapByData = function(gameContext, mapID, mapData) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.createMap(mapID, (id) => createMap(gameContext, id, mapData, 1));

    mapManager.setActiveMap(mapID);

    return worldMap;
}

/**
 * Creates an empty world map by specifying the id and data.
 * 
 * @param {*} gameContext 
 * @param {string} mapID 
 * @param {{}} mapData 
 * @returns 
 */
MapSystem.createEmptyMap = function(gameContext, mapID, mapData) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.createMap(mapID, (id) => createMap(gameContext, id, mapData, 0));

    mapManager.setActiveMap(mapID);

    return worldMap;
}