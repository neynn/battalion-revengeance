import { ContextHelper } from "../../engine/camera/contextHelper.js";
import { EntityHelper } from "../../engine/entity/entityHelper.js";
import { StateMachine } from "../../engine/state/stateMachine.js";
import { TypeRegistry } from "../type/typeRegistry.js";
import { BattalionActor } from "./battalionActor.js";
import { IdleState } from "./player/idle.js";
import { SelectState } from "./player/select.js";

export const Player = function(id, camera) {
    BattalionActor.call(this, id);

    this.tileX = -1;
    this.tileY = -1;
    this.camera = camera;
    this.inspectedEntity = null;

    this.states = new StateMachine(this);
    this.states.addState(Player.STATE.IDLE, new IdleState());
    this.states.addState(Player.STATE.SELECT, new SelectState());
}

Player.EVENT = {
    ENTITY_CLICK: 0,
    BUILDING_CLICK: 1,
    TILE_CLICK: 2,
    TILE_CHANGE: 3
};

Player.STATE = {
    IDLE: "IDLE",
    SELECT: "SELECT"
};

Player.ACTION = {
    CLICK: "CLICK"
};

Player.prototype = Object.create(BattalionActor.prototype);
Player.prototype.constructor = Player;

Player.prototype.inspectEntity = function(gameContext, entity) {
    this.inspectedEntity = entity;

    const displayName = entity.getDisplayName(gameContext);
    const displayDesc = entity.getDisplayDesc(gameContext);

    console.log(displayName, displayDesc);
    console.log("Inspected Entity", entity);
}

Player.prototype.inspectTile = function(gameContext, tileX, tileY) {
    this.inspectedEntity = null;
}

Player.prototype.onClick = function(gameContext, worldMap, tileX, tileY) {
    const entity = EntityHelper.getTileEntity(gameContext, tileX, tileY);

    if(entity) {
        if(this.inspectedEntity === entity) {
            this.inspectTile(gameContext, tileX, tileY);
        } else {
            this.inspectEntity(gameContext, entity);        
        }

        const { teamManager } = gameContext;
        const { teamID } = entity;
        const entityID = entity.getID();
        const isAlly = teamManager.isAlly(this.teamID, teamID);
        const isControlled = this.hasEntity(entityID);

        this.states.eventEnter(gameContext, Player.EVENT.ENTITY_CLICK, { "entity": entity, "isAlly": isAlly, "isControlled": isControlled });
        return;
    }

    const building = worldMap.getBuilding(tileX, tileY);

    if(building) {
        this.states.eventEnter(gameContext, Player.EVENT.BUILDING_CLICK, { "building": building });
        return;
    }

    this.states.eventEnter(gameContext, Player.EVENT.TILE_CLICK, { "x": tileX, "y": tileY });
}

Player.prototype.loadKeybinds = function(gameContext) {
    const { client } = gameContext;
    const { router } = client;
    
    router.bind(gameContext, "PLAY");
    router.on(Player.ACTION.CLICK, () => {
        const { world } = gameContext;
        const { mapManager } = world;
        const worldMap = mapManager.getActiveMap();

        if(worldMap) {
            const tile = ContextHelper.getMouseTile(gameContext);
            const { x, y } = tile;

            this.onClick(gameContext, worldMap, x, y);
        }
    });
}

Player.prototype.activeUpdate = function(gameContext, remainingActions) {
    this.tryEnqueueAction(gameContext);
}

Player.prototype.update = function(gameContext) {
    const { x, y } = ContextHelper.getMouseTile(gameContext);

    if(x !== this.tileX || y !== this.tileY) {
        this.states.eventEnter(gameContext, Player.EVENT.TILE_CHANGE, {
            "x": x,
            "y": y
        });
    }

    this.tileX = x;
    this.tileY = y;
    this.states.update(gameContext);
}

Player.prototype.onNextTurn = function(gameContext, turn) {
    console.log("IT IS TURN " + turn);
}

Player.prototype.onNextRound = function(gameContext, round) {
    console.log("IT IS ROUND " + round);
}

Player.prototype.clearNodeMapRender = function() {
    this.camera.selectOverlay.clear();
    this.camera.pathOverlay.clear();
}

Player.prototype.addNodeMapRender = function(nodeMap) {
    this.clearNodeMapRender();

    for(const [index, node] of nodeMap) {
        const { x, y, flags } = node;
        const id = flags === -1 ? TypeRegistry.TILE_ID.OVERLAY_ATTACK : TypeRegistry.TILE_ID.OVERLAY_MOVE;
    
        this.camera.selectOverlay.add(id, x, y);
    }
}

Player.prototype.showPath = function(gameContext, entity, nodeMap, targetX, targetY) { 
    const { tileManager } = gameContext;
    const autotiler = tileManager.getAutotilerByID("path");
    const path = entity.getPath(gameContext, nodeMap, targetX, targetY);

    this.camera.pathOverlay.clear();

    for(let i = 0; i < path.length; i++) {
        const { deltaX, deltaY, tileX, tileY } = path[i];

        this.camera.pathOverlay.add(5, tileX, tileY);
    }
}