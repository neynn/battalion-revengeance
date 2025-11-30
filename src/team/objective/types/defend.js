import { Objective } from "../objective.js";

export const DefendObjective = function() {
    Objective.call(this, "DEFEND");
}

DefendObjective.prototype = Object.create(Objective.prototype);
DefendObjective.prototype.constructor = DefendObjective;

DefendObjective.prototype.addTarget = function(config) {
    if(this.status !== Objective.STATUS.FAILURE) {
        this.status = Objective.STATUS.IDLE;
        this.createTarget({
            "x": config.x,
            "y": config.y
        });
    }
}

DefendObjective.prototype.onMove = function(gameContext, entity, teamID) {
    if(entity.teamID === teamID) {
        return;
    }

    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const entityID = entity.getID();

    for(const target of this.targets) {
        const { goal } = target;
        const { x, y } = goal;

        if(worldMap.hasEntity(x, y, entityID)) {
            this.fail();
            break;
        }
    }
}