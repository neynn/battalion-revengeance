import { getCursorTile } from "../../engine/camera/contextHelper.js";
import { StateMachine } from "../../engine/state/stateMachine.js";
import { BattalionActor } from "./battalionActor.js";
import { IdleState } from "./player/idle.js";
import { SelectState } from "./player/select.js";
import { DIRECTION, ENTITY_TYPE } from "../enums.js";
import { saveStoryMap } from "../systems/save.js";
import { createProduceIntent } from "../action/actionHelper.js";
import { MapInspector } from "./player/inspector.js";
import { DeathActionVTable } from "../action/types/death.js";
import { EndTurnVTable } from "../action/types/endTurn.js";
import { ExtractVTable } from "../action/types/extract.js";

export const Player = function(id, inspector, camera) {
    BattalionActor.call(this, id);

    this.camera = camera;
    this.inspector = inspector;
    this.maxIntents = 10;

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

Player.prototype.surrender = function(gameContext) {
    const { teamManager } = gameContext;
    const team = teamManager.getTeam(this.teamID);
    
    if(team) {
        const { entities } = team;
        const deathRequest = DeathActionVTable.createIntent(entities);

        this.addIntent(deathRequest);
    }
}

Player.prototype.onTurnStart = function(gameContext) {
    const { client } = gameContext;
    const { session } = client;

    session.actorID = this.id;

    this.clearIntents();
}

Player.prototype.onTurnEnd = function(gameContext) {
    this.clearIntents();
    this.camera.clearOverlays();
    this.states.setNextState(gameContext, Player.STATE.IDLE);
}

Player.prototype.onClick = function(gameContext, tileX, tileY) {
    const { teamManager, world } = gameContext;
    const { mapManager } = world;
    const inspectorState = this.inspector.inspect(gameContext, this, this.camera, tileX, tileY);

    switch(inspectorState) {
        case MapInspector.STATE.TILE: {
            this.states.handleEvent(gameContext, Player.EVENT.TILE_CLICK, { "x": tileX, "y": tileY });
            break;
        }
        case MapInspector.STATE.BUILDING: {
            const worldMap = mapManager.getActiveMap();
            const building = worldMap.getBuilding(tileX, tileY);

            this.states.handleEvent(gameContext, Player.EVENT.BUILDING_CLICK, { "building": building });
            break;
        }
        case MapInspector.STATE.ENTITY: {
            const entity = world.getEntityAt(tileX, tileY);
            const isAlly = teamManager.isAlly(this.teamID, entity.teamID);
            const isControlled = entity.belongsTo(this.teamID);

            this.states.handleEvent(gameContext, Player.EVENT.ENTITY_CLICK, { "entity": entity, "isAlly": isAlly, "isControlled": isControlled });
            break;
        }
    }
}

Player.prototype.loadKeybinds = function(gameContext) {
    const { client } = gameContext;
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
        this.addIntent(EndTurnVTable.createIntent());
    });

    router.on("EXTRACT", () => {
        //Do NOT cache the value. A lookup is meaningless in terms of performance.
        const entity = this.inspector.getLastEntity(gameContext);

        if(entity) {
            this.addIntent(ExtractVTable.createIntent(entity.id));
            this.addIntent(createProduceIntent(entity.id, ENTITY_TYPE.ANNIHILATOR_TANK, DIRECTION.NORTH));
        }
    });
}

Player.prototype.activeUpdate = function(gameContext) {
    this.enqueueNextIntent(gameContext);
}

Player.prototype.update = function(gameContext) {
    const hoverChanged = this.inspector.update(gameContext, this.camera);

    if(hoverChanged) {
        this.states.handleEvent(gameContext, Player.EVENT.TILE_CHANGE, {
            "x": this.inspector.lastHoverX,
            "y": this.inspector.lastHoverY
        });
    }

    this.states.update(gameContext);
}