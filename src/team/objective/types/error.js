import { Objective } from "../objective.js";

export const ErrorObjective = function() {
    Objective.call(this, "LYNCHPIN");

    this.status = Objective.STATUS.IDLE;
}

ErrorObjective.prototype = Object.create(Objective.prototype);
ErrorObjective.prototype.constructor = ErrorObjective;