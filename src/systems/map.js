import { BattalionMap } from "../map/battalionMap.js";
import { BUILDING_TYPE, CLIMATE_TYPE } from "../enums.js";
import { createBuildingSnapshot } from "../snapshot/buildingSnapshot.js";
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
    const { width, height, data, buildings = [], climate = null } = file;
    const worldMap = new BattalionMap(0, width, height);
    
    worldMap.name = source.title;
    worldMap.climate = CLIMATE_TYPE[climate] ?? CLIMATE_TYPE.TEMPERATE;
    worldMap.decodeLayers(data);

    for(const setup of buildings) {
        const {
            x = -1,
            y = -1,
            type = null
        } = setup;
        const snapshot = createBuildingSnapshot();
        const buildingType = BUILDING_TYPE[type] ?? BUILDING_TYPE.COMMAND_CENTER;
        const building = worldMap.createBuilding(gameContext, buildingType, x, y);

        snapshot.type = buildingType;
        snapshot.tileX = x;
        snapshot.tileY = y;

        building.load(snapshot);
    }

    return worldMap;
}

const loadWorldMap = async function(gameContext, sourceID) {
    const { pathHandler, mapRegistry, world } = gameContext;
    const mapSource = mapRegistry.getMapPreview(sourceID);
    const file = await mapSource.promiseFile(pathHandler);

    if(file === null) {
        return Promise.reject();
    }

    const worldMap = createWorldMap(gameContext, file, mapSource);

    world.setWorldMap(worldMap);

    return worldMap;
}

export const MapSystem = {
    getMapFile: async function(gameContext, sourceID) {
        const { pathHandler, mapRegistry, world } = gameContext;
        const mapSource = mapRegistry.getMapPreview(sourceID);
        const file = await mapSource.promiseFile(pathHandler);

        if(file === null) {
            return Promise.reject();
        }

        return file;
    },
    createEmptyMap: function(gameContext, width, height) {
        const { world } = gameContext;
        const worldMap = new BattalionMap(0, width, height);

        world.setWorldMap(worldMap);

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