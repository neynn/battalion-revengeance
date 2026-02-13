import { Objective } from "../objective.js";

export const DefendObjective = function(tiles) {
    Objective.call(this, "DEFEND");

    this.tiles = tiles;
    this.status = Objective.STATUS.IDLE;
}

DefendObjective.prototype = Object.create(Objective.prototype);
DefendObjective.prototype.constructor = DefendObjective;

DefendObjective.prototype.onTurnEnd = function(gameContext, turn, teamID) {
    const { world, teamManager } = gameContext;

    //This objective fails if any enemy is on the specified tile during checking phase.
    for(const { x, y } of this.tiles) {
        const entity = world.getEntityAt(x, y);

        if(entity && !teamManager.isAlly(teamID, entity.teamID)) {
            this.fail();
            break;
        }
    }
}