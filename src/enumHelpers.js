import { ENTITY_CATEGORY, ENTITY_TYPE, JAMMER_FLAG, MINE_TYPE, MOVEMENT_TYPE, TEAM_STAT, TILE_ID, TILE_TYPE, TRANSPORT_TYPE } from "./enums.js";

export const mTryPutValue = function(config, mapping, list, DEBUG_NAME) {
    for(const typeID in config) {
        const index = mapping[typeID];

        if(index !== undefined) {
            list[index] = config[typeID];
        } else {
            console.warn(`${DEBUG_NAME}: Unknown type! ${typeID}`);
        }
    }
}

export const mTryFillDefault = function(config, list) {
    if(config['*'] !== undefined) {
        const defaultValue = config['*'];

        for(let i = 0; i < list.length; i++) {
            list[i] = defaultValue;
        }
    }
}

export const mapCategoryToMine = function(category) {
    switch(category) {
        case ENTITY_CATEGORY.LAND: return MINE_TYPE.LAND;
        case ENTITY_CATEGORY.SEA: return MINE_TYPE.SEA;
        default: return MINE_TYPE.LAND;
    }
}

export const mapCategoryToStat = function(category) {
    switch(category) {
        case ENTITY_CATEGORY.AIR: return TEAM_STAT.AIR_UNITS_BUILT;
        case ENTITY_CATEGORY.SEA: return TEAM_STAT.SEA_UNITS_BUILT;
        case ENTITY_CATEGORY.LAND: return TEAM_STAT.GROUND_UNITS_BUILT;
        default: return TEAM_STAT.GROUND_UNITS_BUILT;
    }
}

export const mapMovementToCategory = function(movementType) {
    switch(movementType) {
        case MOVEMENT_TYPE.FLIGHT: return ENTITY_CATEGORY.AIR;
        case MOVEMENT_TYPE.RUDDER: return ENTITY_CATEGORY.SEA;
        case MOVEMENT_TYPE.HEAVY_RUDDER: return ENTITY_CATEGORY.SEA;
        default: return ENTITY_CATEGORY.LAND;
    }
}

export const mapTransportToEntity = function(transportType) {
    switch(transportType) {
        case TRANSPORT_TYPE.BARGE: return ENTITY_TYPE.LEVIATHAN_BARGE;
        case TRANSPORT_TYPE.PELICAN: return ENTITY_TYPE.PELICAN_TRANSPORT;
        case TRANSPORT_TYPE.STORK: return ENTITY_TYPE.STORK_TRANSPORT;
        default: return ENTITY_TYPE.LEVIATHAN_BARGE;
    }
}

export const downgradeOre = function(tileID) {
    switch(tileID) {
        case TILE_ID.ORE_LEFT: return TILE_ID.ORE_LEFT_USED;
        case TILE_ID.ORE_RIGHT: return TILE_ID.ORE_RIGHT_USED;
        case TILE_ID.ORE_LEFT_USED: return TILE_ID.ORE_LEFT_DEPLETED;
        case TILE_ID.ORE_RIGHT_USED: return TILE_ID.ORE_RIGHT_DEPLETED;
        default: return tileID;
    }
}

export const oreToValue = function(tileID) {
    switch(tileID) {
        case TILE_ID.ORE_LEFT: return 500;
        case TILE_ID.ORE_RIGHT: return 500;
        case TILE_ID.ORE_LEFT_USED: return 300;
        case TILE_ID.ORE_RIGHT_USED: return 300;
        default: return 0;
    }
}

export const resolveTileType = function(type) {
    if(!type) {
        console.error("No TileType given!");

        return TILE_TYPE._INVALID;
    }

    const typeID = TILE_TYPE[type];

    if(typeID === undefined) {
        console.error("TileType does not exist!", type);

        return TILE_TYPE._INVALID;
    }

    return typeID;
}