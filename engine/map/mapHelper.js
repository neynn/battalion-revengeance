import { Layer } from "./layer.js";

export const MapHelper = {
    createLayerByThreshold: function(gameContext, size) {
        const { tileManager } = gameContext;
        const tileCount = tileManager.getTileCount();
        const type = Layer.getTypeFor(tileCount);

        return Layer.create(size, type);
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

        const { data } = mapData;
        const worldMap = mapManager.createMap((id) => {
            const mapObject = onCreate(id, mapData);

            mapObject.loadLayers(data);

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
    loadEmptyMap: function(gameContext, mapData, onCreate) {
        const { world } = gameContext;
        const { mapManager } = world;
        const { data } = mapData;
        
        const worldMap = mapManager.createCustomMap((id) => {
            const mapObject = onCreate(id);

            mapObject.loadLayersEmpty(data);

            return mapObject;
        });

        if(worldMap) {
            const mapID = worldMap.getID();
    
            mapManager.enableMap(mapID);
        }

        return worldMap;
    },
    loadCustomMap: function(gameContext, mapData, onCreate) {
        const { world } = gameContext;
        const { mapManager } = world;
        const { data } = mapData;
        
        const worldMap = mapManager.createCustomMap((id) => {
            const mapObject = onCreate(id);

            mapObject.loadLayers(data);

            return mapObject;
        });

        if(worldMap) {
            const mapID = worldMap.getID();
    
            mapManager.enableMap(mapID);
        }

        return worldMap;
    }
};