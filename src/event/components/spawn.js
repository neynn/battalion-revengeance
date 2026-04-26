import { SimulationComponent } from "../../../engine/world/event/simulationComponent.js";
import { EntitySpawnVTable } from "../../action/types/entitySpawn.js";

export const SpawnComponent = function(snapshot) {
    SimulationComponent.call(this);

    this.snapshot = snapshot;
}

SpawnComponent.prototype = Object.create(SimulationComponent.prototype);
SpawnComponent.prototype.constructor = SpawnComponent;

SpawnComponent.prototype.execute = function(gameContext) {
    const { actionRouter } = gameContext;
    const actionIntent = EntitySpawnVTable.createIntent(this.snapshot);

    actionRouter.forceEnqueue(gameContext, actionIntent);
}