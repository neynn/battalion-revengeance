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

MapSettings.prototype.createOverridesFromMaster = function(mapMaster) {
    const { slots } = mapMaster;

    for(const slot of slots) {
        const { colorMap, name, teamID } = slot;
        const override = {
            "team": teamID,
            "color": colorMap,
            "name": name,
            "allies": []
        };

        this.overrides.push(override);
    }
}
