import { BattalionMap } from "../map/battalionMap.js";
import { BUILDING_TYPE, CLIMATE_TYPE } from "../enums.js";
import { createBuildingSnapshot } from "../snapshot/buildingSnapshot.js";
import { ClientScenarioLoader } from "../scenario/loaders/clientLoader.js";
import { ServerScenarioLoader } from "../scenario/loaders/serverLoader.js";

export const MapSystem = {
    createMapFromScenario: function(scenario) {
        const { id, mapWidth, mapHeight, mapData, climate } = scenario;
        const worldMap = new BattalionMap(0, mapWidth, mapHeight);

        worldMap.scenario = id;
        worldMap.climate = climate;
        worldMap.decodeLayers(mapData);

        return worldMap;
    },
    createEmptyMap: function(gameContext, width, height) {
        const { world } = gameContext;
        const worldMap = new BattalionMap(0, width, height);

        world.setWorldMap(worldMap);

        return worldMap;
    },
    createClientLoader: function(gameContext, scenarioID) {
        const { scenarioRegistry, world } = gameContext;
        const scenario = scenarioRegistry.getScenario(scenarioID);

        if(!scenario) {
            return null;
        }

        const worldMap = MapSystem.createMapFromScenario(scenario);

        world.setWorldMap(worldMap);

        return new ClientScenarioLoader(worldMap, scenario);
    }
};