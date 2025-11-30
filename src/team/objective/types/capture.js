import { Objective } from "../objective.js";

export const CaptureObjective = function() {
    Objective.call(this, "CAPTURE");
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
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const entityID = entity.getID();

    for(const target of this.targets) {
        const { goal } = target;
        const { x, y } = goal;

        if(worldMap.hasEntity(x, y, entityID)) {
            if(entity.teamID === teamID) {
                target.toComplete();
            } else {
                target.toIncomplete();
            }
        }
    }
}