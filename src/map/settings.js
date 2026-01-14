export const MapSettings = function() {
    this.mapID = null;
    this.colors = {};
    this.allies = {};
    this.entities = [];
    this.mode = MapSettings.MODE.PVP;
}

MapSettings.MODE = {
    COOP: 0,
    PVP: 1,
    STORY: 2
};

MapSettings.prototype.addEntity = function(entityID) {
    this.entities.push(entityID);
}

MapSettings.prototype.toJSON = function() {
    return {
        "mapID": this.mapID,
        "colors": this.colors,
        "allies": this.allies,
        "entities": this.entities,
        "mode": this.mode
    }
}

MapSettings.prototype.setAllies = function(teamID, allies) {
    this.allies[teamID] = allies;
}

MapSettings.prototype.setColorPreference = function(teamID, colorID) {
    this.colors[teamID] = colorID;
}