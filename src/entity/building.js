import { LanguageHandler } from "../../engine/language/languageHandler.js";
import { SCHEMA_TYPE, SHOP_TYPE } from "../enums.js";
import { BattalionMap } from "../map/battalionMap.js";
import { createBuildingSnapshot } from "../snapshot/buildingSnapshot.js";
import { StaticObject } from "./staticObject.js";

export const Building = function(config) {
    StaticObject.call(this, config);

    this.customID = BattalionMap.INVALID_CUSTOM_ID;
    this.customName = LanguageHandler.INVALID_ID;
    this.customDesc = LanguageHandler.INVALID_ID;
    this.totalGeneratedCash = 0;
    this.color = SCHEMA_TYPE.RED;
    this.shop = SHOP_TYPE.NONE;
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
    snapshot.shop = this.shop;

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
    this.shop = data.shop;
    this.color = data.color;
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

Building.prototype.getDescription = function(gameContext) {
    const { language } = gameContext;
    
    if(this.customDesc !== LanguageHandler.INVALID_ID) {
        return language.getMapTranslation(this.customDesc);
    }

    return language.getSystemTranslation(this.config.desc);
}

Building.prototype.getName = function(gameContext) {
    const { language } = gameContext;
    
    if(this.customName !== LanguageHandler.INVALID_ID) {
        return language.getMapTranslation(this.customName);
    }

    return language.getSystemTranslation(this.config.name);
}

Building.prototype.getShop = function(gameContext) {
    const { typeRegistry } = gameContext;

    if(this.shop !== SHOP_TYPE.NONE) {
        return typeRegistry.getShopType(this.shop);
    }

    return typeRegistry.getShopType(this.config.shop);
}