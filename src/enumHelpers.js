import { ENTITY_CATEGORY, MOVEMENT_TYPE, TEAM_STAT } from "./enums.js";

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