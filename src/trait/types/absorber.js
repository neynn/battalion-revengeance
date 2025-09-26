import { Trait } from "../trait.js";

export const AbsorberTrait = function() {}

AbsorberTrait.prototype = Object.create(Trait.prototype);
AbsorberTrait.prototype.constructor = AbsorberTrait;