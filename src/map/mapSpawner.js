import { MapHelper } from "../../engine/map/mapHelper.js";
import { BattalionMap } from "./battalionMap.js";

export const MapSpawner = {
    createMapByID: function(gameContext, mapID) {
        return MapHelper.createMapByID(gameContext, mapID, (mapData) => {
            const worldMap = new BattalionMap(mapID);
            const { width, height, data } = mapData;

            worldMap.resize(width, height);
            worldMap.loadLayers(gameContext, data);

            return worldMap;
        });
    },
    createEmptyMap: function(gameContext, mapID, mapData) {
        return MapHelper.createEmptyMap(gameContext, mapID, () => {
            const worldMap = new BattalionMap(mapID);
            const { width, height, data } = mapData;

            worldMap.resize(width, height);
            worldMap.loadLayersEmpty(gameContext, data);

            return worldMap;
        });
    }
}