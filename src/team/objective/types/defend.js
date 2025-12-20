import { Objective } from "../objective.js";

export const DefendObjective = function(tiles) {
    Objective.call(this, "DEFEND");

    this.tiles = tiles;
    this.status = Objective.STATUS.IDLE;
}

DefendObjective.prototype = Object.create(Objective.prototype);
DefendObjective.prototype.constructor = DefendObjective;

DefendObjective.prototype.onEntityMove = function(gameContext, entity, teamID) {
    if(entity.teamID === teamID) {
        return;
    }

    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const entityID = entity.getID();

    for(const { x, y } of this.tiles) {
        if(worldMap.hasEntity(x, y, entityID)) {
            this.fail();
            break;
        }
    }
}