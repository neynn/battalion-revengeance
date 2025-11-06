import { EventEmitter } from "../events/eventEmitter.js";
import { Logger } from "../logger.js";
import { MapSource } from "./mapSource.js";

export const MapManager = function() {
    this.mapSources = new Map();
    this.maps = new Map();
    this.nextID = 0;
    this.activeMap = null;

    this.events = new EventEmitter();
    this.events.register(MapManager.EVENT.MAP_CREATE);
    this.events.register(MapManager.EVENT.MAP_DELETE);
    this.events.register(MapManager.EVENT.MAP_ENABLE);
    this.events.register(MapManager.EVENT.MAP_DISABLE);
}

MapManager.EMPTY_SOURCE = new MapSource("::NO_SOURCE", {});

MapManager.EVENT = {
    MAP_CREATE: "MAP_CREATE",
    MAP_DELETE: "MAP_DELETE",
    MAP_ENABLE: "MAP_ENABLE",
    MAP_DISABLE: "MAP_DISABLE"
};

MapManager.prototype.onLanguageChange = async function(nextLanguage) {
    if(this.activeMap) {
        const mapID = this.activeMap.getID();
        const source = this.activeMap.getSource();
        const translations = await source.promiseTranslations(nextLanguage.getID());

        if(translations !== null) {
            nextLanguage.registerMap(mapID, translations);
            nextLanguage.selectMap(mapID);

            this.activeMap.onLanguageUpdate(nextLanguage, translations);
        }
    }
}

MapManager.prototype.getNextID = function() {
    return this.nextID++;
}

MapManager.prototype.createCustomMap = function(onCreate, externalID) {
    const mapID = externalID !== undefined ? externalID : this.nextID++;

    if(!this.maps.has(mapID)) {
        const worldMap = onCreate(mapID);

        if(worldMap) {
            this.maps.set(mapID, worldMap);
            this.events.emit(MapManager.EVENT.MAP_CREATE, mapID, worldMap);

            return worldMap;
        }
    }

    return null;
}

MapManager.prototype.createSourcedMap = function(onCreate, sourceID, externalID) {
    const mapID = externalID !== undefined ? externalID : this.nextID++;

    if(!this.maps.has(mapID)) {
        const mapSource = this.getMapSource(sourceID);
        const worldMap = onCreate(mapID);

        if(worldMap) {
            worldMap.setSource(mapSource);

            this.maps.set(mapID, worldMap);
            this.events.emit(MapManager.EVENT.MAP_CREATE, mapID, worldMap);

            return worldMap;
        }
    }

    return null;
}

MapManager.prototype.update = function(gameContext) {
    if(this.activeMap) {
        this.activeMap.update(gameContext);
    }
}

MapManager.prototype.load = function(mapSources) {
    if(typeof mapSources !== "object") {
        return;
    }

    for(const sourceID in mapSources) {
        const source = mapSources[sourceID];
        const mapSource = new MapSource(sourceID, source);

        this.mapSources.set(sourceID, mapSource);
    }
}

MapManager.prototype.forAllMaps = function(onCall) {
    if(typeof onCall === "function") {
        this.maps.forEach((map) => onCall(map))
    }
}

MapManager.prototype.enableMap = function(mapID) {
    const worldMap = this.maps.get(mapID);

    if(!worldMap || worldMap === this.activeMap) {
        return;
    }

    if(this.activeMap && this.activeMap !== worldMap) {
        this.disableMap();
    }

    this.activeMap = worldMap;
    this.events.emit(MapManager.EVENT.MAP_ENABLE, mapID, worldMap);
}

MapManager.prototype.getActiveMap = function() {
    return this.activeMap;
}

MapManager.prototype.getMapSource = function(sourceID) {
    const mapSource = this.mapSources.get(sourceID)

    if(!mapSource) {
        return MapManager.EMPTY_SOURCE;
    }

    return mapSource;
}

MapManager.prototype.deleteMap = function(mapID) {
    const loadedMap = this.maps.get(mapID);

    if(!loadedMap) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Map is not loaded!", "MapManager.prototype.deleteMap", { "mapID": mapID });
        return;
    }

    if(this.activeMap === loadedMap) {
        this.disableMap();
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

MapManager.prototype.disableMap = function() {
    if(this.activeMap) {
        const mapID = this.activeMap.getID();

        this.events.emit(MapManager.EVENT.MAP_DISABLE, mapID, this.activeMap);
    }

    this.activeMap = null;
}

MapManager.prototype.exit = function() {
    this.events.muteAll();
    this.maps.clear();
    this.disableMap();
    this.nextID = 0;
}