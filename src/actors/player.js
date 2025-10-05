import { ContextHelper } from "../../engine/camera/contextHelper.js";
import { EntityHelper } from "../../engine/entity/entityHelper.js";
import { StateMachine } from "../../engine/state/stateMachine.js";
import { BattalionActor } from "./battalionActor.js";
import { IdleState } from "./player/idle.js";
import { SelectState } from "./player/select.js";

export const Player = function(id, config) {
    BattalionActor.call(this, id);

    this.config = config;
    this.camera = null;
    this.inspectedEntity = null;

    this.states = new StateMachine(this);
    this.states.addState(Player.STATE.IDLE, new IdleState());
    this.states.addState(Player.STATE.SELECT, new SelectState());
}

Player.EVENT = {
    ENTITY_CLICK: 0,
    BUILDING_CLICK: 1,
    TILE_CLICK: 2
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

Player.prototype.setCamera = function(camera) {
    this.camera = camera;
}

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

Player.prototype.onClick = function(gameContext, worldMap, tile) {
    const { x, y } = tile;
    const entity = EntityHelper.getTileEntity(gameContext, x, y);

    if(entity) {
        if(this.inspectedEntity === entity) {
            this.inspectTile(gameContext, x, y);
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

    const building = worldMap.getBuilding(x, y);

    if(building) {
        this.states.eventEnter(gameContext, Player.EVENT.BUILDING_CLICK, { "building": building });
        return;
    }

    this.states.eventEnter(gameContext, Player.EVENT.TILE_CLICK, { "x": x, "y": y });
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

            this.onClick(gameContext, worldMap, tile);
        }
    });
}

Player.prototype.activeUpdate = function(gameContext, remainingActions) {}

Player.prototype.update = function(gameContext) {
    this.states.update(gameContext);
}

Player.prototype.onNextTurn = function(gameContext, turn) {
    console.log("IT IS TURN " + turn);
}

Player.prototype.onNextRound = function(gameContext, round) {
    console.log("IT IS ROUND " + round);
}