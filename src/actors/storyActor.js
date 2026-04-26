import { EndTurnVTable } from "../action/types/endTurn.js";
import { BattalionActor } from "./battalionActor.js";

export const StoryActor = function(id) {
    BattalionActor.call(this, id);
}

StoryActor.prototype = Object.create(BattalionActor.prototype);
StoryActor.prototype.constructor = StoryActor;

StoryActor.prototype.activeUpdate = function(gameContext) {
    const { world, actionRouter, teamManager } = gameContext;
    const { actionQueue } = world;

    if(actionQueue.isRunning()) {
        return;
    }

    actionRouter.forceEnqueue(gameContext, EndTurnVTable.createIntent());
}