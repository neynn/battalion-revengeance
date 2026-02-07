import { EventComponent } from "../../../engine/world/event/eventComponent.js";
import { createSpawnIntent } from "../../action/actionHelper.js";

export const SpawnComponent = function(entities) {
    EventComponent.call(this);

    this.entities = entities;
}

SpawnComponent.prototype = Object.create(EventComponent.prototype);
SpawnComponent.prototype.constructor = SpawnComponent;

SpawnComponent.prototype.execute = function(gameContext) {
    const { actionRouter } = gameContext;
    const actionIntent = createSpawnIntent(this.entities);

    actionRouter.forceEnqueue(gameContext, actionIntent);
}