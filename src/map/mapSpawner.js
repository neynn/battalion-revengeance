import { MapHelper } from "../../engine/map/mapHelper.js";
import { BattalionMap } from "./battalionMap.js";

export const MapSpawner = {
    createMapByID: function(gameContext, typeID) {
        return MapHelper.createMapByID(gameContext, typeID, (mapID, mapData) => {
            //MapData to broadcast e.g. missions or music.

            return new BattalionMap(mapID);
        });
    },
    createEmptyMap: function(gameContext, mapData) {
        return MapHelper.createEmptyMap(gameContext, mapData, (mapID) => {
            return new BattalionMap(mapID);
        });
    }
}