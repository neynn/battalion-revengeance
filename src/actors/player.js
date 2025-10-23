import { ContextHelper } from "../../engine/camera/contextHelper.js";
import { EntityHelper } from "../../engine/entity/entityHelper.js";
import { StateMachine } from "../../engine/state/stateMachine.js";
import { Autotiler } from "../../engine/tile/autotiler.js";
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

Player.prototype.addNodeMapRender = function(nodeMap, entity) {
    this.clearNodeMapRender();

    for(const [index, node] of nodeMap) {
        const { x, y } = node;
        const id = entity.isNodeValid(node) ? TypeRegistry.TILE_ID.OVERLAY_MOVE : TypeRegistry.TILE_ID.OVERLAY_ATTACK;
        
        //TODO: ADD JAMMED!!!

        this.camera.selectOverlay.add(id, x, y);
    }
}

Player.prototype.showPath = function(gameContext, oPath, entityX, entityY) { 
    const { tileManager } = gameContext;
    const autotiler = tileManager.getAutotilerByID(TypeRegistry.AUTOTILER_ID.PATH);
    const path = oPath.toReversed();

    let tileID = 0;

    this.camera.pathOverlay.clear();

    for(let i = 0; i < path.length; i++) {
        const { tileX, tileY } = path[i];

        //I am sorry.
        if(i === 0) {
            tileID = autotiler.run(tileX, tileY, (nextX, nextY) => {
                if(entityX === nextX && entityY === nextY) {
                    return Autotiler.RESPONSE.VALID;
                }

                if(i < path.length - 1) {
                    const next = path[i + 1];

                    if(next.tileX === nextX && next.tileY === nextY) {
                        return Autotiler.RESPONSE.VALID;
                    }
                }

                return Autotiler.RESPONSE.INVALID;
            });
        } else {
            tileID = autotiler.run(tileX, tileY, (nextX, nextY) => {
                const previous = path[i - 1];

                if(previous.tileX === nextX && previous.tileY === nextY) {
                    return Autotiler.RESPONSE.VALID;
                }

                if(i < path.length - 1) {
                    const next = path[i + 1];
                    
                    if(next.tileX === nextX && next.tileY === nextY) {
                        return Autotiler.RESPONSE.VALID;
                    }
                }

                return Autotiler.RESPONSE.INVALID;
            });
        }

        this.camera.pathOverlay.add(tileID, tileX, tileY);
    }

    //Put the starting node.
    if(path.length !== 0) {
        const { deltaX, deltaY } = path[0];

        if(deltaX === 1) {
            tileID = TypeRegistry.TILE_ID.PATH_RIGHT;
        } else if(deltaX === -1) {
            tileID = TypeRegistry.TILE_ID.PATH_LEFT;
        } else if(deltaY === 1) {
            tileID = TypeRegistry.TILE_ID.PATH_DOWN;
        } else if(deltaY === -1) {
            tileID = TypeRegistry.TILE_ID.PATH_UP;
        }
    } else {
        tileID = TypeRegistry.TILE_ID.PATH_CENTER;
    }

    this.camera.pathOverlay.add(tileID, entityX, entityY);
}