import { MOVEMENT_TYPE } from "../../enums.js";

export const TerrainType = function(id, config) {
    const { 
        name = "MISSING_NAME_TERRAIN",
        desc = "MISSING_DESC_TERRAIN",
        icon = null,
        rangeGuard = false,
        rangeBoost = 0,
        damage = {},
        protection = {},
        cost = {}
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.icon = icon;
    this.rangeGuard = rangeGuard;
    this.rangeBoost = rangeBoost;
    this.damage = [];
    this.cost = [];
    this.protection = [];
    this.defaultDamage = 0;
    this.defaultCost = 0;
    this.defaultProtection = 0;

    if(damage['*'] !== undefined) {
        this.defaultDamage = damage['*'];
    }

    if(cost['*'] !== undefined) {
        this.defaultCost = cost['*'];
    }

    if(protection['*'] !== undefined) {
        this.defaultProtection = protection['*'];
    }

    for(let i = 0; i < MOVEMENT_TYPE._COUNT; i++) {
        this.damage[i] = this.defaultDamage;
    }

    for(let i = 0; i < MOVEMENT_TYPE._COUNT; i++) {
        this.cost[i] = this.defaultCost;
    }

    for(let i = 0; i < MOVEMENT_TYPE._COUNT; i++) {
        this.protection[i] = this.defaultProtection;
    }

    for(const typeID in damage) {
        const index = MOVEMENT_TYPE[typeID];

        if(index !== undefined) {
            this.damage[index] = damage[typeID];
        }
    }

    for(const typeID in cost) {
        const index = MOVEMENT_TYPE[typeID];

        if(index !== undefined) {
            this.cost[index] = cost[typeID];
        }
    }

    for(const typeID in protection) {
        const index = MOVEMENT_TYPE[typeID];

        if(index !== undefined) {
            this.protection[index] = protection[typeID];
        }
    }
}

TerrainType.prototype.getDamage = function(movementType) {
    if(movementType < 0 || movementType >= MOVEMENT_TYPE._COUNT) {
        return 0;
    }

    return this.damage[movementType];
}

TerrainType.prototype.getCost = function(movementType) {
    if(movementType < 0 || movementType >= MOVEMENT_TYPE._COUNT) {
        return 0;
    }

    return this.cost[movementType];
}

TerrainType.prototype.getProtection = function(movementType) {
    if(movementType < 0 || movementType >= MOVEMENT_TYPE._COUNT) {
        return 0;
    }

    return this.protection[movementType];
}