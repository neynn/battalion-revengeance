import { mTryFillDefault, mTryPutValue } from "../../enumHelpers.js";
import { MOVEMENT_TYPE } from "../../enums.js";

export const MineType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_MINE";
    this.desc = "MISSING_DESC_MINE";
    this.cost = 0;
    this.damage = [];

    for(let i = 0; i < MOVEMENT_TYPE._COUNT; i++) {
        this.damage[i] = 0;
    }
}

MineType.prototype.load = function(config, DEBUG_NAME) {
    const {
        name = "MISSING_NAME_MINE",
        desc = "MISSING_DESC_MINE",
        cost = 0,
        damage = {}
    } = config;

    this.name = name;
    this.desc = desc;
    this.cost = cost;

    mTryFillDefault(damage, this.damage);
    mTryPutValue(damage, MOVEMENT_TYPE, this.damage, DEBUG_NAME);
}

MineType.prototype.getDamage = function(movementType) {
    if(movementType < 0 || movementType >= MOVEMENT_TYPE._COUNT) {
        return 0;
    }

    return this.damage[movementType];
}