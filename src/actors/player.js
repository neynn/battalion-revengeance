import { getCursorTile } from "../../engine/camera/contextHelper.js";
import { StateMachine } from "../../engine/state/stateMachine.js";
import { Autotiler } from "../../engine/tile/autotiler.js";
import { BattalionActor } from "./battalionActor.js";
import { IdleState } from "./player/idle.js";
import { SelectState } from "./player/select.js";
import { PATH_FLAG, RANGE_TYPE, TILE_ID } from "../enums.js";
import { saveStoryMap } from "../systems/save.js";
import { createEndTurnIntent, createExtractIntent, createPurchseEntityIntent } from "../action/actionHelper.js";

export const Player = function(id, camera) {
    BattalionActor.call(this, id);

    this.tileX = -1;
    this.tileY = -1;
    this.camera = camera;
    this.lastInspectedEntity = null;
    this.nodeMap = new Map();

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

Player.prototype.inspectEntity = function(gameContext, entity) {
    this.showEntity(gameContext, entity);
    this.lastInspectedEntity = entity;

    console.log("Inspected Entity", {
        "dName":  entity.getName(gameContext),
        "dDesc": entity.getDescription(gameContext),
        "entity": entity
    });
}

Player.prototype.inspectTile = function(gameContext, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const name = worldMap.getTileName(gameContext, tileX, tileY);
    const desc = worldMap.getTileDesc(gameContext, tileX, tileY);
    const climateType = worldMap.getClimateType(gameContext, tileX, tileY);
    const tileType = worldMap.getTileType(gameContext, tileX, tileY);

    this.lastInspectedEntity = null;
    this.clearOverlays();

    console.log("Inspected Tile", {
        "x": tileX,
        "y": tileY,
        "name": name,
        "desc": desc,
        "climate": climateType,
        "type": tileType
    });
}

Player.prototype.onClick = function(gameContext, worldMap, tileX, tileY) {
    const entity = this.getVisibleEntity(gameContext, tileX, tileY);

    if(entity) {
        if(this.lastInspectedEntity === entity) {
            this.inspectTile(gameContext, tileX, tileY);
        } else {
            this.nodeMap.clear();
            entity.mGetNodeMap(gameContext, this.nodeMap);
            this.inspectEntity(gameContext, entity);        
        }

        const { teamManager } = gameContext;
        const { teamID } = entity;
        const isAlly = teamManager.isAlly(this.teamID, teamID);
        const isControlled = this.isControlling(entity);

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
    router.on("CLICK", () => {
        const { world } = gameContext;
        const { mapManager } = world;
        const worldMap = mapManager.getActiveMap();

        if(worldMap) {
            const { x, y } = getCursorTile(gameContext);

            this.onClick(gameContext, worldMap, x, y);
        }
    });

    router.on("DEBUG_SAVE", () => saveStoryMap(gameContext));
    router.on("END_TURN", () => {
        this.addIntent(createEndTurnIntent());
    });

    router.on("EXTRACT", () => {
        if(this.lastInspectedEntity) {
            this.addIntent(createExtractIntent(this.lastInspectedEntity.id));
        }
    });
}

Player.prototype.activeUpdate = function(gameContext) {
    this.tryEnqueueAction(gameContext);
}

Player.prototype.update = function(gameContext) {
    if(this.lastInspectedEntity && this.lastInspectedEntity.isDestroyed()) {
        //TODO: Un-Inspect entity!
        this.lastInspectedEntity = null;
    }

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

Player.prototype.clearOverlays = function() {
    this.camera.selectOverlay.clear();
    this.camera.pathOverlay.clear();
    this.camera.jammerOverlay.clear();
}

Player.prototype.showJammerAt = function(gameContext, entity, jammerX, jammerY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const jammerRange = entity.config.jammerRange;

    this.camera.jammerOverlay.clear();

    worldMap.fill2DGraph(jammerX, jammerY, jammerRange, (nextX, nextY) => {
        this.camera.jammerOverlay.add(TILE_ID.JAMMER, nextX, nextY);
    });
}

Player.prototype.showEntity = function(gameContext, entity) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const rangeType = entity.getRangeType();
    const { tileX, tileY } = entity;
    const canAttack = entity.canAttack();
    const minRange = entity.config.minRange;
    const maxRange = entity.getMaxRange(gameContext);
    const isJammer = entity.isJammer();

    this.clearOverlays();

    switch(rangeType) {
        case RANGE_TYPE.MELEE: {
            for(const [index, node] of this.nodeMap) {
                const { x, y, flags } = node;

                if((flags & PATH_FLAG.UNREACHABLE) === 0) {
                    this.camera.selectOverlay.add(TILE_ID.OVERLAY_MOVE, x, y);
                } else if(canAttack) {
                    this.camera.selectOverlay.add(TILE_ID.OVERLAY_ATTACK_LIGHT, x, y);
                }
            }

            break;
        }
        case RANGE_TYPE.HYBRID:
        case RANGE_TYPE.RANGE: {
            for(const [index, node] of this.nodeMap) {
                const { x, y, flags } = node;
                const distance = entity.getDistanceToTile(x, y);

                //The node is reachable
                if((flags & PATH_FLAG.UNREACHABLE) === 0) {
                    if(distance >= minRange && distance <= maxRange) {
                        this.camera.selectOverlay.add(TILE_ID.OVERLAY_MOVE_ATTACK, x, y);
                    } else {
                        this.camera.selectOverlay.add(TILE_ID.OVERLAY_MOVE, x, y);
                    }
                } else {
                    //The node is unreachable, but still in attack range!
                    if(distance >= minRange && distance <= maxRange) {
                        this.camera.selectOverlay.add(TILE_ID.OVERLAY_ATTACK_LIGHT, x, y);
                    } else {
                        //Not reachable and NOT in attack range.
                        //This node is invisible to the unit.
                    }
                }
            }

            //Fill the rest out to signal attack range.
            worldMap.fill2DGraph(tileX, tileY, maxRange, (nextX, nextY, distance, index) => {
                if(distance >= minRange && !this.nodeMap.has(index)) {
                    this.camera.selectOverlay.add(TILE_ID.OVERLAY_ATTACK, nextX, nextY);
                }
            });

            break;
        }
    }

    if(isJammer) {
        this.showJammerAt(gameContext, entity, tileX, tileY);
    } else {
        this.camera.jammerOverlay.clear();
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
            tileID = TILE_ID.PATH_RIGHT;
        } else if(deltaX === -1) {
            tileID = TILE_ID.PATH_LEFT;
        } else if(deltaY === 1) {
            tileID = TILE_ID.PATH_DOWN;
        } else if(deltaY === -1) {
            tileID = TILE_ID.PATH_UP;
        }
    } else {
        tileID = TILE_ID.PATH_CENTER;
    }

    this.camera.pathOverlay.add(tileID, entityX, entityY);
}

Player.prototype.getVisibleEntity = function(gameContext, tileX, tileY) {
    const { world } = gameContext;
    const entity = world.getEntityAt(tileX, tileY);

    if(entity && entity.isVisibleTo(gameContext, this.teamID)) {
        return entity;
    }

    return null;
}