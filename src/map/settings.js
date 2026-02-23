export const MapSettings = function() {
    this.entities = [];
    this.overrides = [];
}

MapSettings.MISSING_OVERRIDE = {
    "teamID": null,
    "color": null,
    "name": null,
    "allies": []
};

MapSettings.prototype.addEntity = function(entityID) {
    this.entities.push(entityID);
}

MapSettings.prototype.getOverride = function(teamID) {
    for(let i = 0; i < this.overrides.length; i++) {
        if(this.overrides[i].teamID === teamID) {
            return this.overrides[i];
        }
    }

    return MapSettings.MISSING_OVERRIDE;
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
            "teamID": teamID,
            "color": colorMap,
            "name": name,
            "allies": []
        };

        this.overrides.push(override);
    }
}
