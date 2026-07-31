import { mTryFillDefault, mTryPutValue } from "../../enumHelpers.js";
import { MINE_CATEGORY, MINE_TYPE, MOVEMENT_TYPE, TILE_ID, TRAIT_TYPE } from "../../enums.js";

const getVisual = function(type) {
    switch(type) {
        case MINE_TYPE.LAND: return TILE_ID.MINE_LAND;
        case MINE_TYPE.SEA: return TILE_ID.MINE_SEA;
        default: return TILE_ID.NONE;
    }
}

const getNullifierTrait = function(category) {
    switch(category) {
        case MINE_CATEGORY.LAND: return TRAIT_TYPE.ELUSIVE;
        case MINE_CATEGORY.SEA: return TRAIT_TYPE.STEER;
        default: return TRAIT_TYPE._INVALID;
    }
}

export const MineType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_MINE";
    this.desc = "MISSING_DESC_MINE";
    this.cost = 0;
    this.damage = [];
    this.category = MINE_CATEGORY._INVALID;
    this.nullifierTrait = TRAIT_TYPE._INVALID;
    this.tileVisual = getVisual(this.id);

    for(let i = 0; i < MOVEMENT_TYPE._COUNT; i++) {
        this.damage[i] = 0;
    }
}

MineType.prototype.load = function(config, DEBUG_NAME) {
    const {
        name = "MISSING_NAME_MINE",
        desc = "MISSING_DESC_MINE",
        cost = 0,
        damage = {},
        category = "NONE"
    } = config;

    this.name = name;
    this.desc = desc;
    this.cost = cost;
    this.category = MINE_CATEGORY[category] ?? MINE_CATEGORY._INVALID;
    this.nullifierTrait = getNullifierTrait(this.category);

    mTryFillDefault(damage, this.damage);
    mTryPutValue(damage, MOVEMENT_TYPE, this.damage, DEBUG_NAME);
}

MineType.prototype.getDamage = function(movementType) {
    if(movementType < 0 || movementType >= MOVEMENT_TYPE._COUNT) {
        return 0;
    }

    return this.damage[movementType];
}