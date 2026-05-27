import { getCursorTile } from "../../engine/camera/contextHelper.js";
import { StateMachine } from "../../engine/state/stateMachine.js";
import { BattalionActor } from "./battalionActor.js";
import { IdleState } from "./player/idle.js";
import { SelectState } from "./player/select.js";
import { DIRECTION, ENTITY_TYPE, TRANSPORT_TYPE } from "../enums.js";
import { saveStoryMap } from "../systems/save.js";
import { MapInspector } from "../map/mapInspector.js";
import { DeathActionVTable } from "../action/types/death.js";
import { EndTurnVTable } from "../action/types/endTurn.js";
import { ExtractVTable } from "../action/types/extract.js";
import { ProduceVTable } from "../action/types/produceEntity.js";
import { ToTransportVTable } from "../action/types/toTransport.js";
import { FromTransportVTable } from "../action/types/fromTransport.js";
import { BattalionRenderer2D } from "../camera/battalionRenderer2D.js";
import { RepairVTable } from "../action/types/repair.js";

/**
 * 
 * @param {*} id 
 * @param {MapInspector} inspector 
 * @param {BattalionRenderer2D} renderer 
 */
export const Player = function(id, inspector, renderer) {
    BattalionActor.call(this, id);

    this.renderer = renderer;
    this.inspector = inspector;
    this.nodeMap = new Map();
    this.maxIntents = 10;

    this.states = new StateMachine(this);
    this.states.addState(Player.STATE.IDLE, new IdleState());
    this.states.addState(Player.STATE.SELECT, new SelectState());
}

Player.STATE = {
    IDLE: 0,
    SELECT: 1
};

Player.EVENT = {
    ENTITY_CLICK: 0,
    BUILDING_CLICK: 1,
    TILE_CLICK: 2,
    TILE_CHANGE: 3
};

Player.prototype = Object.create(BattalionActor.prototype);
Player.prototype.constructor = Player;

Player.prototype.onTurnStart = function(gameContext) {
    const { client } = gameContext;
    const { session } = client;

    session.actorID = this.id;

    this.clearIntents();
}

Player.prototype.onTurnEnd = function(gameContext) {
    this.clearIntents();
    this.renderer.clearOverlays();
    this.states.setNextState(gameContext, Player.STATE.IDLE);
}

Player.prototype.refreshEntityNodeMap = function(gameContext, entity) {
    this.renderer.clearOverlays();
    this.nodeMap.clear();

    entity.mGetNodeMap(gameContext, this.nodeMap);

    this.renderer.showEntityNodes(gameContext, entity, this.nodeMap);
}

Player.prototype.onClick = function(gameContext, tileX, tileY) {
    const { teamManager, world } = gameContext;
    const { mapManager } = world;
    const inspectorState = this.inspector.inspect(gameContext, this, tileX, tileY);

    this.renderer.clearOverlays();

    switch(inspectorState) {
        case MapInspector.STATE.TILE: {
            this.states.handleEvent(gameContext, Player.EVENT.TILE_CLICK, { "x": tileX, "y": tileY });
            break;
        }
        case MapInspector.STATE.MINE: {
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

            this.refreshEntityNodeMap(gameContext, entity);
            this.states.handleEvent(gameContext, Player.EVENT.ENTITY_CLICK, { "entity": entity });
            break;
        }
        case MapInspector.STATE.ENTITY_MENU: {
            this.states.setNextState(gameContext, Player.STATE.IDLE, {});
            break;
        }
    }
}

Player.prototype.loadKeybinds = function(gameContext) {
    const { client, actionRouter } = gameContext;
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

    router.on("END_TURN", () => {
        this.addIntent(EndTurnVTable.createIntent());
    });

    router.on("TRANSPORT_BARGE", () => {
        const entity = this.inspector.getLastEntity(gameContext);

        if(entity) {
            if(entity.transportID !== -1) {
                this.addIntent(FromTransportVTable.createIntent(entity.id));
            } else {
                this.addIntent(ToTransportVTable.createIntent(entity.id, TRANSPORT_TYPE.BARGE));
            }
        }
    });

    router.on("TRANSPORT_PELICAN", () => {
        const entity = this.inspector.getLastEntity(gameContext);

        if(entity) {
            if(entity.transportID !== -1) {
                this.addIntent(FromTransportVTable.createIntent(entity.id));
            } else {
                this.addIntent(ToTransportVTable.createIntent(entity.id, TRANSPORT_TYPE.PELICAN));
            }
        }
    });

    router.on("TRANSPORT_STORK", () => {
        const entity = this.inspector.getLastEntity(gameContext);

        if(entity) {
            if(entity.transportID !== -1) {
                this.addIntent(FromTransportVTable.createIntent(entity.id));
            } else {
                this.addIntent(ToTransportVTable.createIntent(entity.id, TRANSPORT_TYPE.STORK));
            }
        }
    });

    router.on("EXTRACT", () => {
        const entity = this.inspector.getLastEntity(gameContext);

        if(entity) {
            this.addIntent(ExtractVTable.createIntent(entity.id));
        }
    });

    router.on("PRODUCE", () => {
        const entity = this.inspector.getLastEntity(gameContext);

        if(entity) {
            this.addIntent(ProduceVTable.createIntent(entity.id, ENTITY_TYPE.ANNIHILATOR_TANK, DIRECTION.NORTH));
        }  
    });

    router.on("REPAIR", () => {
        const entity = this.inspector.getLastEntity(gameContext);

        if(entity) {
            this.addIntent(RepairVTable.createIntent(entity.id));
        }   
    });

    router.on("DEBUG_SAVE", () => saveStoryMap(gameContext));

    router.on("DEBUG_KILL", () => {
        const entity = this.inspector.getLastEntity(gameContext);

        if(entity) {
            actionRouter.forceEnqueue(gameContext, DeathActionVTable.createIntent([entity.id]));
        }  
    });
}

Player.prototype.activeUpdate = function(gameContext) {
    this.enqueueNextIntent(gameContext);
}

Player.prototype.update = function(gameContext) {
    const flags = this.inspector.update(gameContext);

    this.renderer.setInspect(this.inspector.lastHoverX, this.inspector.lastHoverY);

    if(flags & MapInspector.FLAG.ENTITY_REMOVED) {
        this.renderer.clearOverlays();
    }

    if(flags & MapInspector.FLAG.HOVER_CHANGED) {
        this.states.handleEvent(gameContext, Player.EVENT.TILE_CHANGE, {
            "x": this.inspector.lastHoverX,
            "y": this.inspector.lastHoverY
        });
    }

    this.states.update(gameContext);
}