import { BattalionMap } from "../map/battalionMap.js";
import { CLIMATE_TYPE } from "../enums.js";
import { createBuildingSnapshotFromJSON } from "../snapshot/buildingSnapshot.js";
import { MapPreview } from "../map/mapPreview.js";
import { ClientScenarioLoader } from "../scenario/loaders/clientLoader.js";
import { ServerScenarioLoader } from "../scenario/loaders/serverLoader.js";

/**
 * 
 * @param {*} gameContext 
 * @param {*} file 
 * @param {MapPreview} source 
 * @returns {BattalionMap}
 */
const createWorldMap = function(gameContext, file, source) {
    const { world } = gameContext;
    const { mapManager } = world;
    const { width, height, data, buildings = [], flags = [], climate = null } = file;
    const nextID = mapManager.getNextID();
    const worldMap = new BattalionMap(nextID, width, height);
    
    worldMap.name = source.title;
    worldMap.climate = CLIMATE_TYPE[climate] ?? CLIMATE_TYPE.TEMPERATE;
    worldMap.loadFlags(flags);
    worldMap.decodeLayers(data);

    for(const setup of buildings) {
        const snapshot = createBuildingSnapshotFromJSON(setup);

        worldMap.createBuilding(gameContext, snapshot);
    }

    return worldMap;
}

const loadWorldMap = async function(gameContext, sourceID) {
    const { pathHandler, mapRegistry, world } = gameContext;
    const { mapManager } = world;
    const mapSource = mapRegistry.getMapPreview(sourceID);
    const file = await mapSource.promiseFile(pathHandler);

    if(file === null) {
        return Promise.reject();
    }

    const worldMap = createWorldMap(gameContext, file, mapSource);

    mapManager.addMap(worldMap);
    mapManager.enableMap(worldMap.getID());

    return worldMap;
}

export const MapSystem = {
    createEmptyMap: function(gameContext, width, height) {
        const { world } = gameContext;
        const { mapManager } = world;
        const nextID = mapManager.getNextID();
        const worldMap = new BattalionMap(nextID, width, height);

        mapManager.addMap(worldMap);
        mapManager.enableMap(nextID);

        return worldMap;
    },
    createEditorLoader: async function(gameContext, scenarioID) {
        const { scenarioRegistry } = gameContext;
        const scenario = scenarioRegistry.getScenario(scenarioID);

        if(!scenario) {
            return Promise.reject();
        }

        const { mapID } = scenario;
        const worldMap = await loadWorldMap(gameContext, mapID);

        worldMap.scenario = scenarioID;

        return new ClientScenarioLoader(worldMap, scenario);
    },
    createClientLoader: async function(gameContext, scenarioID) {
        const { scenarioRegistry } = gameContext;
        const scenario = scenarioRegistry.getScenario(scenarioID);

        if(!scenario) {
            return Promise.reject();
        }

        const { mapID } = scenario;
        const worldMap = await loadWorldMap(gameContext, mapID);

        worldMap.scenario = scenarioID;

        return new ClientScenarioLoader(worldMap, scenario);
    },
    createServerLoader: async function(gameContext, scenarioID) {
        const { scenarioRegistry } = gameContext;
        const scenario = scenarioRegistry.getScenario(scenarioID);

        if(!scenario) {
            return Promise.reject();
        }

        const { mapID } = scenario;
        const worldMap = await loadWorldMap(gameContext, mapID);

        worldMap.scenario = scenarioID;

        return new ServerScenarioLoader(worldMap, scenario);
    }
};