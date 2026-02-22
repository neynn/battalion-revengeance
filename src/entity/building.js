import { StaticObject } from "./staticObject.js";

export const Building = function(config) {
    StaticObject.call(this, config);

    this.customID = null;
    this.customName = null;
    this.customDesc = null;
}

Building.prototype = Object.create(StaticObject.prototype);
Building.prototype.constructor = Building;

Building.prototype.save = function() {
    return {
        "type": this.config.id,
        "teamID": this.teamID,
        "tileX": this.tileX,
        "tileY": this.tileY
    }
}

Building.prototype.load = function(data) {}

Building.prototype.onTeamUpdate = function(gameContext, team) {}

Building.prototype.getGeneratedCash = function(gameContext) {
    const { typeRegistry } = gameContext;
    let generatedCash = 0;

    for(const traitID of this.config.traits) {
        const { cashPerTurn } = typeRegistry.getTraitType(traitID);

        generatedCash += cashPerTurn;
    }

    return generatedCash;
}

Building.prototype.setCustomInfo = function(id, name, desc) {
    this.customID = id;
    this.customName = name;
    this.customDesc = desc
}