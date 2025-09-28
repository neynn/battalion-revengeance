import { Objective } from "../objective.js";

export const DefendObjective = function() {
    Objective.call(this);
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

    for(const target of this.targets) {
        const { config } = target;
        const { x, y } = config;

        if(entity.occupiesTile(x, y)) {
            this.fail();
            break;
        }
    }
}