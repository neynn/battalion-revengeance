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
    loadRegisteredMap: async function(gameContext, typeID, onCreate) {
        const { world, language } = gameContext;
        const { mapManager } = world;
        const currentLanguage = language.getCurrent();
        const languageID = currentLanguage.getID();

        const [mapData, mapTranslations] = await Promise.all([
            mapManager.fetchMapData(typeID),
            mapManager.fetchMapTranslations(typeID, languageID)
        ]);

        if(mapData === null) {
            return Promise.resolve(null);
        }

        const { width, height, data } = mapData;
        const worldMap = mapManager.createMap((id) => {
            const mapObject = onCreate(id, mapData);

            mapObject.resize(width, height);
            mapObject.loadLayers(gameContext, data);

            return mapObject;
        }, typeID);

        if(worldMap) {
            const mapID = worldMap.getID();

            if(mapTranslations !== null) {
                currentLanguage.registerMap(mapID, mapTranslations);
                currentLanguage.selectMap(mapID);
                worldMap.onLanguageUpdate(currentLanguage, mapTranslations);
            }

            mapManager.enableMap(mapID);
        }

        return worldMap;
    },
    loadCustomMap: function(gameContext, mapData, onCreate) {
        const { world } = gameContext;
        const { mapManager } = world;

        let mapID = -1;

        const worldMap = mapManager.createCustomMap((id) => {
            const { width, height, data } = mapData;
            const mapObject = onCreate(id);

            mapObject.resize(width, height);
            mapObject.loadLayersEmpty(gameContext, data);

            mapID = id;
    
            return mapObject;
        });

        if(worldMap) {
            mapManager.enableMap(mapID);
        }

        return worldMap;
    }
};