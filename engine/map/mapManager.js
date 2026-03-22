export const MapManager = function() {
    this.maps = [];
    this.nextID = 0;
    this.activeMap = null;
}

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
}

MapManager.prototype.update = function(gameContext) {
    if(this.activeMap) {
        this.activeMap.update(gameContext);
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
}

MapManager.prototype.getActiveMap = function() {
    return this.activeMap;
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
            
            break;
        }
    }
}

MapManager.prototype.disableMap = function() {
    this.activeMap = null;
}

MapManager.prototype.exit = function() {
    this.maps.length = 0;
    this.disableMap();
    this.nextID = 0;
}