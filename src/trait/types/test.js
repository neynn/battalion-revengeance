import { Trait } from "../trait.js";

export const TestTrait = function() {}

TestTrait.prototype = Object.create(Trait.prototype);
TestTrait.prototype.constructor = TestTrait;