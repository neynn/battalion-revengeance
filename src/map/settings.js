export const MapSettings = function() {
    this.entities = [];
    this.overrides = [];
}

MapSettings.prototype.addEntity = function(entityID) {
    this.entities.push(entityID);
}

MapSettings.prototype.fromJSON = function(json) {
    const { entities, overrides } = json;

    this.entities = entities;
    this.overrides = overrides;

}

MapSettings.prototype.toJSON = function() {
    return {
        "entities": this.entities,
        "overrides": this.overrides
    }
}