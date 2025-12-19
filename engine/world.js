import { ActionQueue } from "./action/actionQueue.js";
import { TurnManager } from "./turn/turnManager.js";
import { EntityManager } from "./entity/entityManager.js";
import { EventBus } from "./eventBus.js";
import { MapManager } from "./map/mapManager.js";

export const World = function() {
    this.actionQueue = new ActionQueue();
    this.turnManager = new TurnManager();
    this.entityManager = new EntityManager();
    this.mapManager = new MapManager();
    this.eventBus = new EventBus();
    
    this.actionQueue.events.on(ActionQueue.EVENT.EXECUTION_COMPLETE, ({ plan }) => {
        this.eventBus.onExecutionComplete(plan);
    }, { permanent: true });
}

World.prototype.exit = function() {
    this.actionQueue.exit();
    this.turnManager.exit();
    this.entityManager.exit();
    this.mapManager.exit();
}

World.prototype.update = function(gameContext) {
    this.actionQueue.update(gameContext);
    this.turnManager.update(gameContext);
    this.mapManager.update(gameContext);
    this.entityManager.update(gameContext);
}