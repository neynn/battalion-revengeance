import { Objective } from "../objective.js";

export const UnitSurviveObjective = function() {
    Objective.call(this, "UNIT_SURVIVE");

    this.units = [];
    this.status = Objective.STATUS.IDLE;
}

UnitSurviveObjective.prototype = Object.create(Objective.prototype);
UnitSurviveObjective.prototype.constructor = UnitSurviveObjective;

UnitSurviveObjective.prototype.isEmpty = function() {
    return this.units.length === 0;
}

UnitSurviveObjective.prototype.addUnit = function(entityID) {
    this.units.push(entityID);
}

UnitSurviveObjective.prototype.onEntityDeath = function(entity) {
    const entityID = entity.getID();

    for(let i = 0; i < this.units.length; i++) {
        if(this.units[i] === entityID) {
            this.units[i] = this.units[this.units.length - 1];
            this.units.pop();
            break;
        }
    }

    if(this.units.length === 0) {
        this.fail();
    }
}