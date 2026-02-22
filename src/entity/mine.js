import { JAMMER_FLAG, MINE_TYPE, TILE_ID } from "../enums.js";
import { StaticObject } from "./staticObject.js";

export const Mine = function(config) {
    StaticObject.call(this, config);

    this.state = Mine.STATE.HIDDEN;
    this.opacity = 0;
}

Mine.STATE = {
    HIDDEN: 0,
    VISIBLE: 1
};

Mine.prototype = Object.create(StaticObject.prototype);
Mine.prototype.constructor = Mine;

Mine.prototype.save = function() {
    return {
        "type": this.config.id,
        "tileX": this.tileX,
        "tileY": this.tileY,
        "teamID": this.teamID,
        "state": this.state
    }
}

Mine.prototype.load = function(data) {
    this.state = data.state;
    this.opacity = this.state === Mine.STATE.HIDDEN ? 0 : 1;
} 

Mine.prototype.hide = function() {
    this.state = Mine.STATE.HIDDEN;
}

Mine.prototype.show = function() {
    this.state = Mine.STATE.VISIBLE;
}

Mine.prototype.isHidden = function() {
    return this.state === Mine.STATE.HIDDEN;
}

Mine.prototype.getJammerFlag = function() {
    switch(this.config.id) {
        case MINE_TYPE.LAND: return JAMMER_FLAG.RADAR;
        case MINE_TYPE.SEA: return JAMMER_FLAG.SONAR;
        default: return JAMMER_FLAG.NONE;
    }
}

Mine.prototype.getTileSprite = function() {
    switch(this.config.id) {
        case MINE_TYPE.LAND: return TILE_ID.VOLANO;
        case MINE_TYPE.SEA: return TILE_ID.VOLANO;
        default: return TILE_ID.VOLANO;
    }
}

Mine.prototype.getDamage = function(movementType) {
    return this.config.getDamage(movementType);
}