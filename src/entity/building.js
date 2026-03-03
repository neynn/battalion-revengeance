import { StaticObject } from "./staticObject.js";

export const Building = function(config) {
    StaticObject.call(this, config);

    this.customID = null;
    this.customName = null;
    this.customDesc = null;
    this.totalGeneratedCash = 0;
}

Building.prototype = Object.create(StaticObject.prototype);
Building.prototype.constructor = Building;

Building.prototype.save = function() {
    return {
        "type": this.config.id,
        "teamID": this.teamID,
        "tileX": this.tileX,
        "tileY": this.tileY,
        "id": this.customID,
        "desc": this.customDesc,
        "name": this.customName,
        "totalGeneratedCash": this.totalGeneratedCash
    }
}

Building.prototype.load = function(data) {
    this.customID = data.id;
    this.customName = data.name;
    this.customDesc = data.desc;
    this.totalGeneratedCash = data.totalGeneratedCash;
}

Building.prototype.generateCash = function(gameContext) {
    const { typeRegistry } = gameContext;
    let generatedCash = 0;

    for(const traitID of this.config.traits) {
        const { cashPerTurn } = typeRegistry.getTraitType(traitID);

        generatedCash += cashPerTurn;
    }

    this.totalGeneratedCash += generatedCash;

    return generatedCash;
}

Building.prototype.setCustomInfo = function(id, name, desc) {
    this.customID = id;
    this.customName = name;
    this.customDesc = desc
}

Building.prototype.getDescription = function(gameContext) {
    const { language } = gameContext;
    
    if(this.customDesc !== null) {
        return language.getMapTranslation(this.customDesc);
    }

    return language.getSystemTranslation(this.config.desc);
}

Building.prototype.getName = function(gameContext) {
    const { language } = gameContext;
    
    if(this.customName !== null) {
        return language.getMapTranslation(this.customName);
    }

    return language.getSystemTranslation(this.config.name);
}