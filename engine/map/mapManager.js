import { EventEmitter } from "../events/eventEmitter.js";
import { PathHandler } from "../resources/pathHandler.js";
import { Logger } from "../logger.js";

export const MapManager = function() {
    this.mapTypes = {};
    this.maps = new Map();
    this.nextID = 0;
    this.activeMap = null;
    this.mapFiles = new Map();
    this.cacheEnabled = true;

    this.events = new EventEmitter();
    this.events.listen(MapManager.EVENT.MAP_CREATE);
    this.events.listen(MapManager.EVENT.MAP_DELETE);
    this.events.listen(MapManager.EVENT.MAP_ENABLE);
    this.events.listen(MapManager.EVENT.MAP_DISABLE);
}

MapManager.EVENT = {
    MAP_CREATE: "MAP_CREATE",
    MAP_DELETE: "MAP_DELETE",
    MAP_ENABLE: "MAP_ENABLE",
    MAP_DISABLE: "MAP_DISABLE"
};

MapManager.prototype.createMap = function(mapID, onCreate) {
    if(this.maps.has(mapID)) {
        return this.maps.get(mapID);
    }

    const worldMap = onCreate(mapID);

    this.maps.set(mapID, worldMap);
    this.events.emit(MapManager.EVENT.MAP_CREATE, mapID, worldMap);

    return worldMap;
}

MapManager.prototype.update = function(gameContext) {
    if(this.activeMap) {
        this.activeMap.update(gameContext);
    }
}

MapManager.prototype.load = function(mapTypes) {
    if(typeof mapTypes !== "object") {
        Logger.log(Logger.CODE.ENGINE_WARN, "MapTypes cannot be undefined!", "MapManager.prototype.load", null);
        return;
    }

    this.mapTypes = mapTypes;
}

MapManager.prototype.forAllMaps = function(onCall) {
    if(typeof onCall === "function") {
        this.maps.forEach((map) => onCall(map))
    }
}

MapManager.prototype.fetchMapData = async function(mapID) {
    const mapType = this.getMapType(mapID);

    if(!mapType) {
        Logger.log(Logger.CODE.ENGINE_WARN, "MapType does not exist!", "MapManager.prototype.loadMapData", { "mapID": mapID });
        return null;
    }

    if(this.cacheEnabled) {
        const cachedMap = this.mapFiles.get(mapID);

        if(cachedMap) {
            return cachedMap;
        }
    }

    const { directory, source } = mapType;
    const filePath = PathHandler.getPath(directory, source);
    const mapData = await PathHandler.promiseJSON(filePath);

    if(!mapData) {
        Logger.log(Logger.CODE.ENGINE_WARN, "MapData does not exist!", "MapManager.prototype.loadMapData", { "mapID": mapID });
        return null;
    }

    if(this.cacheEnabled) {
        this.mapFiles.set(mapID, mapData);
    }

    return mapData;
}

MapManager.prototype.setActiveMap = function(mapID) {
    const worldMap = this.maps.get(mapID);

    if(!worldMap || worldMap === this.activeMap) {
        return;
    }

    if(this.activeMap && this.activeMap !== worldMap) {
        this.clearActiveMap();
    }

    this.activeMap = worldMap;
    this.events.emit(MapManager.EVENT.MAP_ENABLE, mapID, worldMap);
}

MapManager.prototype.getActiveMap = function() {
    return this.activeMap;
}

MapManager.prototype.getMapType = function(mapID) {
    const mapType = this.mapTypes[mapID];

    if(!mapType) {
        Logger.log(Logger.CODE.ENGINE_WARN, "MapType does not exist!", "MapManager.prototype.getMapType", { mapID });
        return null;
    }

    return mapType;
}

MapManager.prototype.deleteMap = function(mapID) {
    const loadedMap = this.maps.get(mapID);

    if(!loadedMap) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Map is not loaded!", "MapManager.prototype.deleteMap", { "mapID": mapID });
        return;
    }

    if(this.activeMap === loadedMap) {
        this.clearActiveMap();
    }

    this.maps.delete(mapID);
    this.events.emit(MapManager.EVENT.MAP_DELETE, mapID, loadedMap);
}

MapManager.prototype.getMap = function(mapID) {
    const loadedMap = this.maps.get(mapID);

    if(!loadedMap) {
        return null;
    }

    return loadedMap;
}

MapManager.prototype.clearActiveMap = function() {
    if(this.activeMap) {
        const mapID = this.activeMap.getID();

        this.events.emit(MapManager.EVENT.MAP_DISABLE, mapID, this.activeMap);
    }

    this.activeMap = null;
}

MapManager.prototype.exit = function() {
    this.events.muteAll();
    this.maps.clear();
    this.clearActiveMap();
    this.nextID = 0;
}