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
        const { world, language } = gameContext;
        const { mapManager } = world;
        const currentLanguage = language.getCurrent();

        let mapData = null;
        let mapLanguage = null;

        if(currentLanguage) {
            const response = await Promise.all([
                mapManager.fetchMapData(mapID),
                mapManager.fetchMapTranslations(mapID, language.getCurrent())
            ]);

            mapData = response[0];
            mapLanguage = response[1];
        } else {
            mapData = await mapManager.fetchMapData(mapID);
        }

        const worldMap = mapManager.createMap(mapID, (id) => MapHelper.initializeMap(gameContext, id, mapData));

        mapManager.setActiveMap(mapID);

        if(mapLanguage) {
            language.registerMap(mapID, mapLanguage);
        }

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