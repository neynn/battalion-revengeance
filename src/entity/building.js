import { LanguageHandler } from "../../engine/language/languageHandler.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { SHOP_TYPE } from "../enums.js";
import { ScenarioModel } from "../scenarioModel.js";
import { createBuildingSnapshot } from "../snapshot/buildingSnapshot.js";
import { TeamManager } from "../team/teamManager.js";
import { BuildingType } from "../type/parsed/buildingType.js";

/**
 * 
 * @param {BuildingType} config 
 */
export const Building = function(config) {
    this.config = config;
    this.tileX = -1;
    this.tileY = -1;
    this.teamID = TeamManager.INVALID_ID;
    this.spriteID = SpriteManager.INVALID_ID;
    this.customID = ScenarioModel.INVALID_CUSTOM_ID;
    this.customName = LanguageHandler.INVALID_ID;
    this.customDesc = LanguageHandler.INVALID_ID;
    this.totalGeneratedCash = 0;
    this.shop = SHOP_TYPE.NONE;
}

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
    snapshot.shop = this.shop;

    return snapshot;
}

Building.prototype.load = function(data) {
    this.customID = data.id;
    this.customName = data.name;
    this.customDesc = data.desc;
    this.totalGeneratedCash = data.totalGeneratedCash;
    this.shop = data.shop;
    this.teamID = data.teamID;
}

Building.prototype.setTeam = function(teamID) {
    this.teamID = teamID;
}

Building.prototype.getTeam = function(gameContext) {
    const { teamManager } = gameContext;

    return teamManager.getTeam(this.teamID);
}

Building.prototype.belongsTo = function(teamID) {
    return this.teamID !== TeamManager.INVALID_ID && this.teamID === teamID;
}

Building.prototype.isPlacedOn = function(tileX, tileY) {
    return this.tileX === tileX && this.tileY === tileY;
}

Building.prototype.hasTrait = function(traitID) {
    for(let i = 0; i < this.config.traits.length; i++) {
        if(this.config.traits[i] === traitID) {
            return true;
        }
    }

    return false;
}

Building.prototype.generateCash = function(gameContext) {
    const { typeRegistry } = gameContext;
    const { traits } = this.config;
    let generatedCash = 0;

    for(const traitID of traits) {
        const { cashPerTurn } = typeRegistry.getTraitType(traitID);

        generatedCash += cashPerTurn;
    }

    this.totalGeneratedCash += generatedCash;

    return generatedCash;
}

Building.prototype.getDescription = function(gameContext) {
    const { language } = gameContext;
    
    if(this.customDesc !== LanguageHandler.INVALID_ID) {
        return language.getScenarioTranslation(this.customDesc);
    }

    return language.getSystemTranslation(this.config.desc);
}

Building.prototype.getName = function(gameContext) {
    const { language } = gameContext;
    
    if(this.customName !== LanguageHandler.INVALID_ID) {
        return language.getScenarioTranslation(this.customName);
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

