import { Layer } from "./layer.js";

export const MapHelper = {
    createLayerByThreshold: function(gameContext, size) {
        const { tileManager } = gameContext;
        const tileCount = tileManager.getTileCount();
        const type = Layer.getTypeFor(tileCount);

        return Layer.create(size, type);
    },
    fetchRegisteredMap: async function(gameContext, sourceID) {
        const { world, language } = gameContext;
        const { mapManager } = world;
        const currentLanguage = language.getCurrent();
        const languageID = currentLanguage.getID();
        const mapSource = mapManager.getMapSource(sourceID);
        const [mapFile, mapTranslations] = await Promise.all([
            mapSource.promiseFile(),
            mapSource.promiseTranslations(languageID)
        ]);

        return {
            "file": mapFile,
            "translations": mapTranslations
        }
    },
    registerMap: function(gameContext, worldMap, mapTranslations) {
        const { world, language } = gameContext;
        const { mapManager } = world;
        const currentLanguage = language.getCurrent();
        const mapID = worldMap.getID();

        if(mapTranslations !== null) {
            currentLanguage.registerMap(mapID, mapTranslations);
            currentLanguage.selectMap(mapID);
            worldMap.onLanguageUpdate(currentLanguage, mapTranslations);
        }

        mapManager.enableMap(mapID);
    }
};