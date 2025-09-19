export const MapHelper = {
    createMapByID: async function(gameContext, mapID, onCreate) {
        const { world, language } = gameContext;
        const { mapManager } = world;
        const cachedMap = mapManager.getMap(mapID);

        if(cachedMap) {
            return cachedMap;
        }

        const currentLanguage = language.getCurrent();

        let mapData = null;
        let mapLanguage = null;

        if(currentLanguage) {
            const response = await Promise.all([
                mapManager.fetchMapData(mapID),
                mapManager.fetchMapTranslations(mapID, currentLanguage)
            ]);

            mapData = response[0];
            mapLanguage = response[1];
        } else {
            mapData = await mapManager.fetchMapData(mapID);
        }

        const worldMap = onCreate(mapData);

        if(worldMap) {
            mapManager.addMap(mapID, worldMap);
            mapManager.enableMap(mapID);

            if(mapLanguage) {
                language.registerMap(mapID, mapLanguage);
                worldMap.onLanguageUpdate(currentLanguage, mapLanguage);
            }
        }

        return worldMap;
    },
    createEmptyMap: function(gameContext, mapID, onCreate) {
        const { world } = gameContext;
        const { mapManager } = world;
        const cachedMap = mapManager.getMap(mapID);

        if(cachedMap) {
            return cachedMap;
        }

        const worldMap = onCreate();

        if(worldMap) {
            mapManager.addMap(mapID, worldMap);
            mapManager.enableMap(mapID);
        }

        return worldMap;
    }
};