import { EventComponent } from "../../../engine/world/event/eventComponent.js";
import { createSpawnIntent } from "../../action/actionHelper.js";

export const SpawnComponent = function(snapshot) {
    EventComponent.call(this);

    this.snapshot = snapshot;
}

SpawnComponent.prototype = Object.create(EventComponent.prototype);
SpawnComponent.prototype.constructor = SpawnComponent;

SpawnComponent.prototype.execute = function(gameContext) {
    const { actionRouter } = gameContext;
    const actionIntent = createSpawnIntent(this.snapshot);

    actionRouter.forceEnqueue(gameContext, actionIntent);
}