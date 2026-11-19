import { getCursorTile } from "../../engine/camera/contextHelper.js";
import { StateMachine } from "../../engine/state/stateMachine.js";
import { BattalionActor } from "./battalionActor.js";
import { IdleState } from "./player/idle.js";
import { SelectState } from "./player/select.js";
import { DIRECTION, ENTITY_TYPE, INPUT_TRIGGER, TRANSPORT_TYPE } from "../enums.js";
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
 * @param {BattalionRenderer2D} renderer 
 */
export const Player = function(id, renderer) {
    BattalionActor.call(this, id);

    this.renderer = renderer;
    this.maxIntents = 10;
    this.state = Player.STATE.WATCHING;

    this.states = new StateMachine(this);
    this.states.addState(Player.STATE.IDLE, new IdleState());
    this.states.addState(Player.STATE.SELECT, new SelectState());
}

Player.STATE = {
    IDLE: 0,
    SELECT: 1,
    WATCHING: 2
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
    const { teamManager } = gameContext;

    teamManager.clientTeam = this.teamID;

    this.state = Player.STATE.IDLE;
    this.clearIntents();
}

Player.prototype.onTurnEnd = function(gameContext) {
    this.clearIntents();
    this.renderer.clearOverlays();
    this.states.setNextState(gameContext, Player.STATE.IDLE);
    this.state = Player.STATE.WATCHING;
}

Player.prototype.refreshEntityNodeMap = function(gameContext, entity) {
    const { world } = gameContext;
    const worldMap = world.getWorldMap();
    const pathfinder = worldMap.pathfinder;

    this.renderer.clearOverlays();

    if(!entity.isDead() && entity.isMoveable()) {
        pathfinder.computeMovement(gameContext, entity);
    } else {
        //Updated the generation so that the ranged overlay can be visualized correctly.
        pathfinder.beginSearch();
    }
    
    pathfinder.addRangedOverlay(gameContext, entity);

    this.renderer.usePathfinderGeneration(pathfinder.searchID);
}

Player.prototype.stopRenderingPathfinder = function() {
    this.renderer.usePathfinderGeneration(0);
}

Player.prototype.onClick = function(gameContext, tileX, tileY) {
    const { teamManager, world, mapInspector } = gameContext;

    mapInspector.inspect(gameContext, this, tileX, tileY);

    this.renderer.clearOverlays();

    switch(mapInspector.state) {
        case MapInspector.STATE.TILE: {
            this.stopRenderingPathfinder();
            this.states.handleEvent(gameContext, Player.EVENT.TILE_CLICK, { "x": tileX, "y": tileY });
            break;
        }
        case MapInspector.STATE.MINE: {
            this.stopRenderingPathfinder();
            this.states.handleEvent(gameContext, Player.EVENT.TILE_CLICK, { "x": tileX, "y": tileY });
            break;
        }
        case MapInspector.STATE.BUILDING: {
            const worldMap = world.getWorldMap();
            const building = worldMap.getBuilding(tileX, tileY);

            this.stopRenderingPathfinder();
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
            this.stopRenderingPathfinder();
            this.states.setNextState(gameContext, Player.STATE.IDLE, {});
            break;
        }
    }
}

Player.prototype.loadKeybinds = function(gameContext) {
    const { client, mapInspector } = gameContext;
    const { router } = client;
    
    router.useConfig(gameContext, "PLAY", INPUT_TRIGGER);

    router.on(INPUT_TRIGGER.CLICK, () => {
        const { world } = gameContext;
        const worldMap = world.getWorldMap();

        if(worldMap) {
            const { x, y } = getCursorTile(gameContext);

            this.onClick(gameContext, x, y);
        }
    });

    router.on(INPUT_TRIGGER.END_TURN, () => {
        this.addIntent(EndTurnVTable.createIntent());
    });

    router.on(INPUT_TRIGGER.TRANSPORT_BARGE, () => {
        const entity = mapInspector.getLastEntity(gameContext);

        if(entity) {
            if(entity.transportID !== -1) {
                this.addIntent(FromTransportVTable.createIntent(entity.id));
            } else {
                this.addIntent(ToTransportVTable.createIntent(entity.id, TRANSPORT_TYPE.BARGE));
            }
        }
    });

    router.on(INPUT_TRIGGER.TRANSPORT_PELICAN, () => {
        const entity = mapInspector.getLastEntity(gameContext);

        if(entity) {
            if(entity.transportID !== -1) {
                this.addIntent(FromTransportVTable.createIntent(entity.id));
            } else {
                this.addIntent(ToTransportVTable.createIntent(entity.id, TRANSPORT_TYPE.PELICAN));
            }
        }
    });

    router.on(INPUT_TRIGGER.TRANSPORT_STORK, () => {
        const entity = mapInspector.getLastEntity(gameContext);

        if(entity) {
            if(entity.transportID !== -1) {
                this.addIntent(FromTransportVTable.createIntent(entity.id));
            } else {
                this.addIntent(ToTransportVTable.createIntent(entity.id, TRANSPORT_TYPE.STORK));
            }
        }
    });

    router.on(INPUT_TRIGGER.EXTRACT, () => {
        const entity = mapInspector.getLastEntity(gameContext);

        if(entity) {
            this.addIntent(ExtractVTable.createIntent(entity.id));
        }
    });

    router.on(INPUT_TRIGGER.PRODUCE, () => {
        const entity = mapInspector.getLastEntity(gameContext);

        if(entity) {
            this.addIntent(ProduceVTable.createIntent(entity.id, ENTITY_TYPE.ANNIHILATOR_TANK, DIRECTION.NORTH));
        }  
    });

    router.on(INPUT_TRIGGER.REPAIR, () => {
        const entity = mapInspector.getLastEntity(gameContext);

        if(entity) {
            this.addIntent(RepairVTable.createIntent(entity.id));
        }   
    });

    router.on(INPUT_TRIGGER.DEBUG_SAVE, () => saveStoryMap(gameContext));

    router.on(INPUT_TRIGGER.DEBUG_KILL, () => {
        const entity = mapInspector.getLastEntity(gameContext);

        if(entity) {
            this.addIntent(DeathActionVTable.createIntent([entity.id]));
        }  
    });
}

Player.prototype.activeUpdate = function(gameContext) {
    this.enqueueNextIntent(gameContext);
}

Player.prototype.update = function(gameContext) {
    const { world, mapInspector } = gameContext;
    const { lastHoverX, lastHoverY, hasTileChanged } = mapInspector;
    const worldMap = world.getWorldMap();

    if(hasTileChanged) {
        this.states.handleEvent(gameContext, Player.EVENT.TILE_CHANGE, {
            "x": lastHoverX,
            "y": lastHoverY
        });
    }

    this.states.update(gameContext);
}