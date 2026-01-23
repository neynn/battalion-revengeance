import { StaticObject } from "./staticObject.js";

export const Landmine = function(config) {
    StaticObject.call(this, config);
}

Landmine.prototype = Object.create(StaticObject.prototype);
Landmine.prototype.constructor = Landmine;