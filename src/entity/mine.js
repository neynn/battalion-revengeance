import { MINE_TYPE } from "../enums.js";
import { StaticObject } from "./staticObject.js";

export const Mine = function(config) {
    StaticObject.call(this, config);

    this.type = MINE_TYPE.LAND;
    this.state = Mine.STATE.HIDDEN;
    this.opacity = 0;
}

Mine.STATE = {
    HIDDEN: 0,
    VISIBLE: 1
};

Mine.prototype = Object.create(StaticObject.prototype);
Mine.prototype.constructor = Mine;

Mine.prototype.hide = function() {
    this.state = Mine.STATE.HIDDEN;
}

Mine.prototype.show = function() {
    this.state = Mine.STATE.VISIBLE;
}

Mine.prototype.isHidden = function() {
    return this.state === Mine.STATE.HIDDEN;
}