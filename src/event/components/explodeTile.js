import { SimulationComponent } from "../../../engine/world/event/simulationComponent.js";
import { createTileExplodeIntent } from "../../action/actionHelper.js";

export const ExplodeTileComponent = function(layer, tileX, tileY) {
    SimulationComponent.call(this);

    this.layer = layer;
    this.tileX = tileX;
    this.tileY = tileY;
}

ExplodeTileComponent.prototype = Object.create(SimulationComponent.prototype);
ExplodeTileComponent.prototype.constructor = ExplodeTileComponent;

ExplodeTileComponent.prototype.execute = function(gameContext) {
    const { actionRouter } = gameContext;
    const actionIntent = createTileExplodeIntent(this.layer, this.tileX, this.tileY);

    actionRouter.forceEnqueue(gameContext, actionIntent);
}