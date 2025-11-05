import { ContextHelper } from "../../engine/camera/contextHelper.js";
import { EntityHelper } from "../../engine/entity/entityHelper.js";
import { StateMachine } from "../../engine/state/stateMachine.js";
import { Autotiler } from "../../engine/tile/autotiler.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
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
    this.showJammer(gameContext, entity);
    this.inspectedEntity = entity;

    const displayName = entity.getDisplayName(gameContext);
    const displayDesc = entity.getDisplayDesc(gameContext);

    console.log(displayName, displayDesc);
    console.log("Inspected Entity", entity);
}

Player.prototype.inspectTile = function(gameContext, tileX, tileY) {
    console.log("Inspected Tile");
    this.inspectedEntity = null;
    this.camera.jammerOverlay.clear();
}

Player.prototype.onClick = function(gameContext, worldMap, tileX, tileY) {
    const entity = this.getVisibleEntity(gameContext, tileX, tileY);

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

    this.inspectTile(gameContext, tileX, tileY);
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

Player.prototype.showJammer = function(gameContext, entity) {
    if(entity.isJammer()) {
        const { tileX, tileY } = entity;

        this.showJammerAt(gameContext, entity, tileX, tileY);
    } else {
        this.camera.jammerOverlay.clear();
    }
}

Player.prototype.showJammerAt = function(gameContext, entity, jammerX, jammerY) {
    const worldMap = gameContext.getActiveMap();
    const jammerRange = entity.config.jammerRange;

    this.camera.jammerOverlay.clear();

    worldMap.fill2DGraph(jammerX, jammerY, jammerRange, (nextX, nextY) => {
        this.camera.jammerOverlay.add(TypeRegistry.TILE_ID.JAMMER, nextX, nextY);
    });
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

Player.prototype.clearOverlays = function() {
    this.camera.selectOverlay.clear();
    this.camera.pathOverlay.clear();
    this.camera.jammerOverlay.clear();
}

Player.prototype.addNodeMapRender = function(nodeMap) {
    this.clearOverlays();

    for(const [index, node] of nodeMap) {
        const { x, y } = node;
        const id = BattalionEntity.isNodeReachable(node) ? TypeRegistry.TILE_ID.OVERLAY_MOVE : TypeRegistry.TILE_ID.OVERLAY_ATTACK;

        this.camera.selectOverlay.add(id, x, y);
    }
}

Player.prototype.showPath = function(autotiler, oPath, entityX, entityY) { 
    const path = oPath.toReversed();

    let previousX = entityX;
    let previousY = entityY;
    let nextX = -2;
    let nextY = -2;
    let tileID = 0;

    this.camera.pathOverlay.clear();

    for(let i = 0; i < path.length; i++) {
        const { tileX, tileY } = path[i];

        if(i < path.length - 1) {
            nextX = path[i + 1].tileX;
            nextY = path[i + 1].tileY;
        } else {
            nextX = -2;
            nextY = -2;
        }

        tileID = autotiler.run(tileX, tileY, (currentX, currentY) => {
            if(previousX === currentX && previousY === currentY) {
                return Autotiler.RESPONSE.VALID;
            }

            if(nextX === currentX && nextY === currentY) {
                return Autotiler.RESPONSE.VALID;
            }

            return Autotiler.RESPONSE.INVALID;
        });

        previousX = tileX;
        previousY = tileY;

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

Player.prototype.getVisibleEntity = function(gameContext, tileX, tileY) {
    const entity = EntityHelper.getTileEntity(gameContext, tileX, tileY);

    if(entity && entity.isVisibleTo(gameContext, this.teamID)) {
        return entity;
    }

    return null;
}