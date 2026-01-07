import { MapSource } from "./mapSource.js";

export const MapRepository = function() {
    this.mapSources = new Map();
}

MapRepository.EMPTY_SOURCE = new MapSource("::NO_SOURCE", {});

MapRepository.prototype.load = function(mapSources) {
    if(typeof mapSources !== "object") {
        return;
    }

    for(const sourceID in mapSources) {
        const source = mapSources[sourceID];
        const mapSource = new MapSource(sourceID, source);

        this.mapSources.set(sourceID, mapSource);
    }
}

MapRepository.prototype.getMapSource = function(sourceID) {
    const mapSource = this.mapSources.get(sourceID)

    if(!mapSource) {
        return MapRepository.EMPTY_SOURCE;
    }

    return mapSource;
}