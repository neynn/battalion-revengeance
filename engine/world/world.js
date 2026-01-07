import { ActionQueue } from "../action/actionQueue.js";
import { TurnManager } from "./turn/turnManager.js";
import { EntityManager } from "../entity/entityManager.js";
import { MapManager } from "../map/mapManager.js";
import { WorldEventHandler } from "./event/worldEventHandler.js";

export const World = function() {
    this.actionQueue = new ActionQueue();
    this.turnManager = new TurnManager();
    this.entityManager = new EntityManager();
    this.mapManager = new MapManager();
    this.eventHandler = new WorldEventHandler();
}

World.prototype.exit = function() {
    this.actionQueue.exit();
    this.turnManager.exit();
    this.entityManager.exit();
    this.mapManager.exit();
    this.eventHandler.exit();
}

World.prototype.update = function(gameContext) {
    this.actionQueue.update(gameContext);
    this.turnManager.update(gameContext);
    this.mapManager.update(gameContext);
    this.entityManager.update(gameContext);
}

//TODO: Add query methods.