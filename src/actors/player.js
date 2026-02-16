import { getCursorTile } from "../../engine/camera/contextHelper.js";
import { StateMachine } from "../../engine/state/stateMachine.js";
import { BattalionActor } from "./battalionActor.js";
import { IdleState } from "./player/idle.js";
import { SelectState } from "./player/select.js";
import { DIRECTION } from "../enums.js";
import { saveStoryMap } from "../systems/save.js";
import { createEndTurnIntent, createExtractIntent, createProduceEntityIntent, createPurchseEntityIntent } from "../action/actionHelper.js";
import { MapInspector } from "./player/inspector.js";

export const Player = function(id, camera) {
    BattalionActor.call(this, id);

    this.tileX = -1;
    this.tileY = -1;
    this.camera = camera;
    this.inspector = new MapInspector(camera);

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

Player.prototype = Object.create(BattalionActor.prototype);
Player.prototype.constructor = Player;

Player.prototype.onTurnStart = function(gameContext) {
    this.camera.setMainPerspective(this.teamID);
}

Player.prototype.onClick = function(gameContext, tileX, tileY) {
    const { teamManager, world } = gameContext;
    const inspectorState = this.inspector.inspect(gameContext, this, tileX, tileY);

    switch(inspectorState) {
        case MapInspector.STATE.TILE: {
            this.states.eventEnter(gameContext, Player.EVENT.TILE_CLICK, { "x": tileX, "y": tileY });
            break;
        }
        case MapInspector.STATE.BUILDING: {
            //Buildings are kept for the runtime, so a cache is okay.
            const building = this.inspector.lastInspectedBuilding;

            this.states.eventEnter(gameContext, Player.EVENT.BUILDING_CLICK, { "building": building });
            break;
        }
        case MapInspector.STATE.ENTITY: {
            const entity = world.getEntityAt(tileX, tileY);
            const isAlly = teamManager.isAlly(this.teamID, entity.teamID);
            const isControlled = this.isControlling(entity);

            this.states.eventEnter(gameContext, Player.EVENT.ENTITY_CLICK, { "entity": entity, "isAlly": isAlly, "isControlled": isControlled });
            break;
        }
    }
}

Player.prototype.loadKeybinds = function(gameContext) {
    const { client, world } = gameContext;
    const { router } = client;
    
    router.bind(gameContext, "PLAY");
    router.on("CLICK", () => {
        const { world } = gameContext;
        const { mapManager } = world;
        const worldMap = mapManager.getActiveMap();

        if(worldMap) {
            const { x, y } = getCursorTile(gameContext);

            this.onClick(gameContext, x, y);
        }
    });

    router.on("DEBUG_SAVE", () => saveStoryMap(gameContext));
    router.on("END_TURN", () => {
        this.addIntent(createEndTurnIntent());
    });

    router.on("EXTRACT", () => {
        //Do NOT cache the value. A lookup is meaningless in terms of performance.
        const entity = world.getEntityAt(this.inspector.lastX, this.inspector.lastY);

        if(entity) {
            //this.addIntent(createExtractIntent(entity.id));
            this.addIntent(createProduceEntityIntent(entity.id, "ANNIHILATOR_TANK", DIRECTION.WEST));
        }
    });
}

Player.prototype.activeUpdate = function(gameContext) {
    this.tryEnqueueAction(gameContext);
}

Player.prototype.update = function(gameContext) {
    const { x, y } = getCursorTile(gameContext);

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

Player.prototype.getVisibleEntity = function(gameContext, tileX, tileY) {
    const { world } = gameContext;
    const entity = world.getEntityAt(tileX, tileY);

    if(entity && entity.isVisibleTo(gameContext, this.teamID)) {
        return entity;
    }

    return null;
}