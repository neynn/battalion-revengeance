import { EventComponent } from "../../../engine/world/event/eventComponent.js";
import { createSpawnIntent } from "../../action/actionHelper.js";

export const SpawnComponent = function(snapshots) {
    EventComponent.call(this);

    this.snapshots = snapshots;
}

SpawnComponent.prototype = Object.create(EventComponent.prototype);
SpawnComponent.prototype.constructor = SpawnComponent;

SpawnComponent.prototype.execute = function(gameContext) {
    const { actionRouter } = gameContext;
    const actionIntent = createSpawnIntent(this.snapshots);

    actionRouter.forceEnqueue(gameContext, actionIntent);
}