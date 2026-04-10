import { SimulationComponent } from "../../../engine/world/event/simulationComponent.js";
import { createSpawnIntent } from "../../action/actionHelper.js";

export const SpawnComponent = function(snapshot) {
    SimulationComponent.call(this);

    this.snapshot = snapshot;
}

SpawnComponent.prototype = Object.create(SimulationComponent.prototype);
SpawnComponent.prototype.constructor = SpawnComponent;

SpawnComponent.prototype.execute = function(gameContext) {
    const { actionRouter } = gameContext;
    const actionIntent = createSpawnIntent(this.snapshot);

    actionRouter.forceEnqueue(gameContext, actionIntent);
}