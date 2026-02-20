import { MOVEMENT_TYPE } from "../../enums.js";

export const TerrainType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_TERRAIN";
    this.desc = "MISSING_DESC_TERRAIN";
    this.icon = null;
    this.rangeGuard = false;
    this.rangeBoost = 0;
    this.damage = [];
    this.cost = [];
    this.protection = [];

    for(let i = 0; i < MOVEMENT_TYPE._COUNT; i++) {
        this.damage[i] = 0;
    }

    for(let i = 0; i < MOVEMENT_TYPE._COUNT; i++) {
        this.cost[i] = 0;
    }

    for(let i = 0; i < MOVEMENT_TYPE._COUNT; i++) {
        this.protection[i] = 0;
    }
}

TerrainType.prototype.load = function(config, DEBUG_NAME) {
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

    this.name = name;
    this.desc = desc;
    this.icon = icon;
    this.rangeGuard = rangeGuard;
    this.rangeBoost = rangeBoost;

    if(damage['*'] !== undefined) {
        const defaultDamage = damage['*'];

        for(let i = 0; i < MOVEMENT_TYPE._COUNT; i++) {
            this.damage[i] = defaultDamage;
        }
    }

    if(cost['*'] !== undefined) {
        const defaultCost = cost['*'];

        for(let i = 0; i < MOVEMENT_TYPE._COUNT; i++) {
            this.cost[i] = defaultCost;
        }
    }

    if(protection['*'] !== undefined) {
        const defaultProtection = protection['*'];

        for(let i = 0; i < MOVEMENT_TYPE._COUNT; i++) {
            this.protection[i] = defaultProtection;
        }
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