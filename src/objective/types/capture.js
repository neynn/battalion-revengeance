import { Objective } from "../objective.js";

export const CaptureObjective = function() {
    Objective.call(this);
}

CaptureObjective.prototype = Object.create(Objective.prototype);
CaptureObjective.prototype.constructor = CaptureObjective;

CaptureObjective.prototype.addTarget = function(config) {
    this.createTarget({
        "x": config.x,
        "y": config.y
    });
}

CaptureObjective.prototype.onMove = function(gameContext, entity, teamID) {
    for(const target in this.targets) {
        const { goal } = target;
        const { x, y } = goal;

        if(entity.occupiesTile(x, y)) {
            if(entity.teamID === teamID) {
                target.toComplete();
            } else {
                target.toIncomplete();
            }
        }
    }
}