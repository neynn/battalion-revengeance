export const MapHelper = {
    createMapByID: async function(gameContext, typeID, onCreate) {
        const { world, language } = gameContext;
        const { mapManager } = world;
        const currentLanguage = language.getCurrent();

        let mapData = null;
        let mapLanguage = null;

        if(currentLanguage) {
            const response = await Promise.all([
                mapManager.fetchMapData(typeID),
                mapManager.fetchMapTranslations(typeID, currentLanguage)
            ]);

            mapData = response[0];
            mapLanguage = response[1];
        } else {
            mapData = await mapManager.fetchMapData(typeID);
        }

        const worldMap = mapManager.createMap((mapID, mapType) => {
            const mapObject = onCreate(mapID, mapData);

            mapObject.setConfig(mapType);

            return mapObject;
        }, typeID);

        if(worldMap) {
            const mapID = worldMap.getID();

            mapManager.enableMap(mapID);

            if(mapLanguage) {
                language.registerMap(mapID, mapLanguage);
                worldMap.onLanguageUpdate(currentLanguage, mapLanguage);
            }
        }

        return worldMap;
    },
    createEmptyMap: function(gameContext, onCreate) {
        const { world } = gameContext;
        const { mapManager } = world;
        const worldMap = mapManager.createEmptyMap((mapID) => {
            const mapObject = onCreate(mapID);

            return mapObject;
        });

        if(worldMap) {
            const mapID = worldMap.getID();

            mapManager.enableMap(mapID);
        }

        return worldMap;
    }
};