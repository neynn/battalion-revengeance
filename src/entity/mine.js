import { JAMMER_FLAG, MINE_CATEGORY, MINE_TYPE, TILE_ID, TRAIT_TYPE } from "../enums.js";
import { createMineSnapshot } from "../snapshot/mineSnapshot.js";
import { TeamManager } from "../team/teamManager.js";
import { MineType } from "../type/parsed/mineType.js";

/**
 * 
 * @param {MineType} config 
 */
export const Mine = function(config) {
    this.config = config;
    this.tileX = -1;
    this.tileY = -1;
    this.teamID = TeamManager.INVALID_ID;
    this.opacity = 0;
    this.flags = Mine.FLAG.HIDDEN;
}

Mine.FLAG = {
    NONE: 0,
    HIDDEN: 1 << 0
};

Mine.prototype.save = function() {
    const snapshot = createMineSnapshot();

    snapshot.type = this.config.id;
    snapshot.tileX = this.tileX;
    snapshot.tileY = this.tileY;
    snapshot.teamID = this.teamID;
    snapshot.flags = this.flags;

    return snapshot;
}

Mine.prototype.load = function(data) {
    this.flags = data.flags;

    if(this.flags & Mine.FLAG.HIDDEN) {
        this.opacity = 0;
    } else {
        this.opacity = 1;
    }
} 

Mine.prototype.isVisibleTo = function(gameContext, teamID) {
    if(!(this.flags & Mine.FLAG.HIDDEN)) {
        return true;
    }

    const { teamManager } = gameContext;
    const isAlly = teamManager.isAlly(this.teamID, teamID);

    return isAlly;
}

Mine.prototype.isJammed = function(jammerFlags) {
    switch(this.config.id) {
        case MINE_TYPE.LAND: return (jammerFlags & JAMMER_FLAG.RADAR) !== 0;
        case MINE_TYPE.SEA: return (jammerFlags & JAMMER_FLAG.SONAR) !== 0;
        default: return false;
    }
}

Mine.prototype.setOpacity = function(opacity) {
    this.opacity = opacity;
}

Mine.prototype.hide = function() {
    this.flags |= Mine.FLAG.HIDDEN;
    this.opacity = 0;
}

Mine.prototype.show = function() {
    this.flags &= ~Mine.FLAG.HIDDEN;
    this.opacity = 1;
}

Mine.prototype.isHidden = function() {
    return (this.flags & Mine.FLAG.HIDDEN) !== 0;
}

Mine.prototype.getDamage = function(movementType) {
    return this.config.getDamage(movementType);
}

Mine.prototype.getTileSprite = function() {
    switch(this.config.id) {
        case MINE_TYPE.LAND: return TILE_ID.MINE_LAND;
        case MINE_TYPE.SEA: return TILE_ID.MINE_SEA;
        default: return TILE_ID.JAMMER;
    }
}

Mine.prototype.getNullifierTrait = function() {
    switch(this.config.category) {
        case MINE_CATEGORY.LAND: return TRAIT_TYPE.ELUSIVE;
        case MINE_CATEGORY.SEA: return TRAIT_TYPE.STEER;
        default: return TRAIT_TYPE._INVALID;
    }
}

Mine.prototype.isPlacedOn = function(tileX, tileY) {
    return this.tileX === tileX && this.tileY === tileY;
}