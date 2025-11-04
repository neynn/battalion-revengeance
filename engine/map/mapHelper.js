import { Layer } from "./layer.js";

const createLayer8 = function(size) {
    return new Layer(new Uint8Array(size), Layer.THRESHOLD.BIT_8);   
}

const createLayer16 = function(size) {
    return new Layer(new Uint16Array(size), Layer.THRESHOLD.BIT_16);
}

const createLayer32 = function(size) {
    return new Layer(new Uint32Array(size), Layer.THRESHOLD.BIT_32);
}

const transformThresholdToType = function(maxValue) {
    if(maxValue <= Layer.THRESHOLD.BIT_8) {
        return Layer.TYPE.BIT_8;
    } else if(maxValue <= Layer.THRESHOLD.BIT_16) {
        return Layer.TYPE.BIT_16;
    } else {
        return Layer.TYPE.BIT_32;
    }
}

export const MapHelper = {
    createLayer: function(size, type) {
        switch(type) {
            case Layer.TYPE.BIT_8: return createLayer8(size);
            case Layer.TYPE.BIT_16: return createLayer16(size);
            case Layer.TYPE.BIT_32: return createLayer32(size);
            default: return createLayer8(size);
        }
    },
    createLayerByThreshold: function(gameContext, size) {
        const { tileManager } = gameContext;
        const tileCount = tileManager.getTileCount();
        const type = transformThresholdToType(tileCount);
        const layer = MapHelper.createLayer(size, type);

        return layer;
    },
    enableMap: function(gameContext, worldMap, mapTranslations) {
        if(worldMap) {
            const { world, language } = gameContext;
            const { mapManager } = world;
            const currentLanguage = language.getCurrent();
            const mapID = worldMap.getID();

            currentLanguage.registerMap(mapID, mapTranslations);
            currentLanguage.selectMap(mapID);

            worldMap.onLanguageUpdate(currentLanguage, mapTranslations);
            
            mapManager.enableMap(mapID);
        }
    },
    createMapByID: async function(gameContext, typeID, onCreate) {
        const { world, language } = gameContext;
        const { mapManager } = world;
        const currentLanguage = language.getCurrent();

        let mapData = null;
        let mapLanguage = null;

        const response = await Promise.all([
            mapManager.fetchMapData(typeID),
            mapManager.fetchMapTranslations(typeID, currentLanguage)
        ]);

        mapData = response[0];
        mapLanguage = response[1];

        const worldMap = mapManager.createMap((mapID, mapType) => {
            const { width, height, data } = mapData;
            const mapObject = onCreate(mapID, mapData);

            mapObject.setConfig(mapType);
            mapObject.resize(width, height);
            mapObject.loadLayers(gameContext, data);

            return mapObject;
        }, typeID);

        MapHelper.enableMap(gameContext, worldMap, mapLanguage);

        return worldMap;
    },
    createMapByData: function(gameContext, mapData, mapLanguage, onCreate) {
        const { world } = gameContext;
        const { mapManager } = world;

        const worldMap = mapManager.createCustomMap((mapID) => {
            const { width, height, data } = mapData;
            const mapObject = onCreate(mapID);

            mapObject.resize(width, height);
            mapObject.loadLayers(gameContext, data);

            return mapObject;
        });

        MapHelper.enableMap(gameContext, worldMap, mapLanguage);

        return worldMap;
    },
    createEmptyMap: function(gameContext, mapData, onCreate) {
        const { world } = gameContext;
        const { mapManager } = world;

        const worldMap = mapManager.createCustomMap((mapID) => {
            const { width, height, data } = mapData;
            const mapObject = onCreate(mapID);

            mapObject.resize(width, height);
            mapObject.loadLayersEmpty(gameContext, data);

            return mapObject;
        });

        MapHelper.enableMap(gameContext, worldMap, {});

        return worldMap;
    }
};