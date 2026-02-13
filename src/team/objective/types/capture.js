import { Objective } from "../objective.js";

export const CaptureObjective = function(tiles) {
    Objective.call(this, "CAPTURE");

    this.tiles = tiles;
}

CaptureObjective.prototype = Object.create(Objective.prototype);
CaptureObjective.prototype.constructor = CaptureObjective;

CaptureObjective.prototype.onTurnEnd = function(gameContext, turn, teamID) {
    const { world } = gameContext;
    let totalCaptures = 0;

    //This objective succeeds if all specified tiles are under the teams, and only the teams, control.
    for(const { x, y } of this.tiles) {
        const entity = world.getEntityAt(x, y);

        if(entity && entity.teamID === teamID) {
            totalCaptures++;
        }
    }

    if(totalCaptures === this.tiles.length) {
        this.status = Objective.STATUS.SUCCESS;
    } else {
        this.status = Objective.STATUS.ACTIVE;
    }
}