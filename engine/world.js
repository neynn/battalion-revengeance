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

    this.entityManager.events.on(EntityManager.EVENT.ENTITY_DESTROY, (entityID) => {
        this.turnManager.removeEntity(entityID);
    }, { permanent: true });
    
    this.actionQueue.events.on(ActionQueue.EVENT.EXECUTION_COMPLETE, (executionItem) => {
        this.eventBus.onExecutionComplete(executionItem);
    }, { permanent: true });

    this.addDebug();
}

World.DEBUG = {
    LOG_ACTION_EVENTS: 0,
    LOG_TURN_EVENTS: 0,
    LOG_ENTITY_EVENTS: 0,
    LOG_MAP_EVENTS: 0
};

World.prototype.addDebug = function() {
    if(World.DEBUG.LOG_ACTION_EVENTS) {
        this.actionQueue.events.on(ActionQueue.EVENT.EXECUTION_DEFER, (item, request) => console.log(item, request), { permanent: true });
        this.actionQueue.events.on(ActionQueue.EVENT.EXECUTION_ERROR, (request, type) => console.log(request, type), { permanent: true });
        this.actionQueue.events.on(ActionQueue.EVENT.EXECUTION_RUNNING, (item) => console.log(item), { permanent: true });
        this.actionQueue.events.on(ActionQueue.EVENT.EXECUTION_COMPLETE, (error) => console.log(error), { permanent: true });
    }

    if(World.DEBUG.LOG_TURN_EVENTS) {
        this.turnManager.events.on(TurnManager.EVENT.ACTIONS_CLEAR, (actor, remainder) => console.log(actor, remainder), { permanent: true });
        this.turnManager.events.on(TurnManager.EVENT.ACTIONS_REDUCE, (actor, remainder) => console.log(actor, remainder), { permanent: true });
        this.turnManager.events.on(TurnManager.EVENT.ACTOR_CHANGE, (current, next) => console.log(current, next), { permanent: true });
        this.turnManager.events.on(TurnManager.EVENT.ACTOR_ADD, (id, actor) => console.log(id, actor), { permanent: true });
        this.turnManager.events.on(TurnManager.EVENT.ACTOR_REMOVE, (id) => console.log(id), { permanent: true });
    }

    if(World.DEBUG.LOG_ENTITY_EVENTS) {
        this.entityManager.events.on(EntityManager.EVENT.ENTITY_CREATE, (id, entity) => console.log(id, entity), { permanent: true });
        this.entityManager.events.on(EntityManager.EVENT.ENTITY_DESTROY, (id) => console.log(id), { permanent: true });
    }

    if(World.DEBUG.LOG_MAP_EVENTS) {
        this.mapManager.events.on(MapManager.EVENT.MAP_ENABLE, (id, map) => console.log("MAP_ENABLE", id, map), { permanent: true });
        this.mapManager.events.on(MapManager.EVENT.MAP_DISABLE, (id, map) => console.log("MAP_DISABLE", id, map), { permanent: true });
        this.mapManager.events.on(MapManager.EVENT.MAP_CREATE, (id, map) => console.log("MAP_CREATE", id, map), { permanent: true });
        this.mapManager.events.on(MapManager.EVENT.MAP_DELETE, (id, map) => console.log("MAP_DELETE", id, map), { permanent: true });
    }
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