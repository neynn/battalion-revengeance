import { Objective } from "../objective.js";

export const CaptureObjective = function(tiles) {
    Objective.call(this, "CAPTURE");

    this.tiles = tiles;
}

CaptureObjective.prototype = Object.create(Objective.prototype);
CaptureObjective.prototype.constructor = CaptureObjective;

CaptureObjective.prototype.onEntityMove = function(gameContext, entity, teamID) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const entityID = entity.getID();
    let totalCaptures = 0;

    for(const { x, y } of this.tiles) {
        if(worldMap.hasEntity(x, y, entityID)) {
            if(entity.teamID === teamID) {
                totalCaptures++;
            }
        }
    }

    if(totalCaptures === this.tiles.length) {
        this.status = Objective.STATUS.SUCCESS;
    } else {
        this.status = Objective.STATUS.ACTIVE;
    }
}