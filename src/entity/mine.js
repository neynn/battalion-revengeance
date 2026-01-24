import { ENTITY_CATEGORY } from "../enums.js";
import { StaticObject } from "./staticObject.js";

export const Mine = function(config) {
    StaticObject.call(this, config);

    this.target = ENTITY_CATEGORY.LAND;
}

Mine.prototype = Object.create(StaticObject.prototype);
Mine.prototype.constructor = Mine;