import { EventEmitter } from "../events/eventEmitter.js";
import { MapSource } from "./mapSource.js";

export const MapManager = function() {
    this.mapSources = new Map();
    this.maps = [];
    this.nextID = 0;
    this.activeMap = null;

    this.events = new EventEmitter();
    this.events.register(MapManager.EVENT.MAP_CREATE);
    this.events.register(MapManager.EVENT.MAP_DESTROY);
    this.events.register(MapManager.EVENT.MAP_ENABLE);
    this.events.register(MapManager.EVENT.MAP_DISABLE);
}

MapManager.EMPTY_SOURCE = new MapSource("::NO_SOURCE", {});

MapManager.EVENT = {
    MAP_CREATE: "MAP_CREATE",
    MAP_DESTROY: "MAP_DESTROY",
    MAP_ENABLE: "MAP_ENABLE",
    MAP_DISABLE: "MAP_DISABLE"
};

MapManager.prototype.getNextID = function() {
    return this.nextID++;
}

MapManager.prototype.addMap = function(worldMap) {
    const mapID = worldMap.id;

    for(let i = 0; i < this.maps.length; i++) {
        if(this.maps[i].id === mapID) {
            return;
        }
    }

    this.maps.push(worldMap);
    this.events.emit(MapManager.EVENT.MAP_CREATE, {
        "map": worldMap
    });
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
        for(const map of this.maps) {
            onCall(map);
        }
    }
}

MapManager.prototype.getMap = function(mapID) {
    for(let i = 0; i < this.maps.length; i++) {
        if(this.maps[i].id === mapID) {
            return this.maps[i];
        }
    }

    return null;
}

MapManager.prototype.enableMap = function(mapID) {
    const worldMap = this.getMap(mapID);

    if(!worldMap || worldMap === this.activeMap) {
        return;
    }

    if(this.activeMap && this.activeMap !== worldMap) {
        this.disableMap();
    }

    this.activeMap = worldMap;
    this.events.emit(MapManager.EVENT.MAP_ENABLE, {
        "id": mapID,
        "map": worldMap
    });
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

MapManager.prototype.destroyMap = function(mapID) {
    for(let i = 0; i < this.maps.length; i++) {
        const worldMap = this.maps[i];

        if(worldMap.id === mapID) {
            this.maps[i] = this.maps[this.maps.length - 1];
            this.maps.pop();

            if(this.activeMap === worldMap) {
                this.disableMap();
            }

            this.events.emit(MapManager.EVENT.MAP_DESTROY, {
                "mapID": mapID
            });
            
            break;
        }
    }
}

MapManager.prototype.disableMap = function() {
    if(this.activeMap) {
        const mapID = this.activeMap.getID();

        this.events.emit(MapManager.EVENT.MAP_DISABLE, {
            "id": mapID,
            "map": this.activeMap
        });
    }

    this.activeMap = null;
}

MapManager.prototype.exit = function() {
    this.events.muteAll();
    this.maps.length = 0;
    this.disableMap();
    this.nextID = 0;
}