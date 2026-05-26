import { FIXED_DELTA_TIME } from "../../engine/engine_constants.js";
import { EndTurnVTable } from "../action/types/endTurn.js";
import { BattalionActor } from "./battalionActor.js";

export const StoryActor = function(id) {
    BattalionActor.call(this, id);

    this.timePassed = 0;
}

StoryActor.prototype = Object.create(BattalionActor.prototype);
StoryActor.prototype.constructor = StoryActor;

StoryActor.prototype.onTurnEnd = function(gameContext) {
    this.timePassed = 0;
}

StoryActor.prototype.activeUpdate = function(gameContext) {
    this.timePassed += FIXED_DELTA_TIME;

    if(this.timePassed < 2) {
        return;
    }

    const { world, actionRouter, teamManager } = gameContext;
    const { actionQueue } = world;

    if(actionQueue.isRunning()) {
        return;
    }

    actionRouter.forceEnqueue(gameContext, EndTurnVTable.createIntent());
}