import { SCHEMA_TYPE } from "../enums.js";
import { createBuildingSnapshot } from "../snapshot/buildingSnapshot.js";
import { StaticObject } from "./staticObject.js";

export const Building = function(config) {
    StaticObject.call(this, config);

    this.customID = null;
    this.customName = null;
    this.customDesc = null;
    this.totalGeneratedCash = 0;
    this.color = SCHEMA_TYPE.RED;
}

Building.prototype = Object.create(StaticObject.prototype);
Building.prototype.constructor = Building;

Building.prototype.save = function() {
    const snapshot = createBuildingSnapshot();

    snapshot.type = this.config.id;
    snapshot.teamID = this.teamID;
    snapshot.tileX = this.tileX;
    snapshot.tileY = this.tileY;
    snapshot.id = this.customID;
    snapshot.desc = this.customDesc;
    snapshot.name = this.customName;
    snapshot.totalGeneratedCash = this.totalGeneratedCash;
    snapshot.color = this.color;

    return snapshot;
}

Building.prototype.setColor = function(color) {
    this.color = color;
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