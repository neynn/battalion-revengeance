import { BattalionMap } from "./battalionMap.js";

export const MapHelper = {
    initializeEmptyMap: function(gameContext, mapID, mapData) {
        const worldMap = new BattalionMap(mapID);
        const { width, height, data } = mapData;

        worldMap.resize(width, height);
        worldMap.loadLayersEmpty(gameContext, data);

        return worldMap;
    },
    initializeMap: function(gameContext, mapID, mapData) {
        const worldMap = new BattalionMap(mapID);
        const { width, height, data } = mapData;

        worldMap.resize(width, height);
        worldMap.loadLayers(gameContext, data);

        return worldMap;
    },
    createMapById: async function(gameContext, mapID) {
        const { world } = gameContext;
        const { mapManager } = world;
        const mapData = await mapManager.fetchMapData(mapID);

        if(!mapData) {
            return null;
        }

        const worldMap = mapManager.createMap(mapID, (id) => MapHelper.initializeMap(gameContext, id, mapData));

        mapManager.setActiveMap(mapID);

        return worldMap;
    },
    createEmptyMap: function(gameContext, mapID, mapData) {
        const { world } = gameContext;
        const { mapManager } = world;
        const worldMap = mapManager.createMap(mapID, (id) => MapHelper.initializeEmptyMap(gameContext, id, mapData));

        mapManager.setActiveMap(mapID);

        return worldMap;
    }
};