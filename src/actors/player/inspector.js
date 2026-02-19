import { getCursorTile } from "../../../engine/camera/contextHelper.js";
import { Autotiler } from "../../../engine/tile/autotiler.js";
import { PATH_FLAG, RANGE_TYPE, TILE_ID } from "../../enums.js";

export const MapInspector = function(camera) {
    this.lastX = -1;
    this.lastY = -1;
    this.lastHoverX = -1;
    this.lastHoverY = -1;
    this.state = MapInspector.STATE.NONE;
    this.camera = camera;
    this.nodeMap = new Map();
    this.lastInspectedBuilding = null;
}

MapInspector.STATE = {
    NONE: 0,
    TILE: 1,
    BUILDING: 2,
    ENTITY: 3
};

MapInspector.prototype.clearOverlays = function() {
    this.camera.selectOverlay.clear();
    this.camera.pathOverlay.clear();
    this.camera.jammerOverlay.clear();
}

MapInspector.prototype.showJammerAt = function(gameContext, entity, jammerX, jammerY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const jammerRange = entity.config.jammerRange;

    this.camera.jammerOverlay.clear();

    worldMap.fill2DGraph(jammerX, jammerY, jammerRange, (nextX, nextY) => {
        this.camera.jammerOverlay.add(TILE_ID.JAMMER, nextX, nextY);
    });
}

MapInspector.prototype.showEntity = function(gameContext, entity) {
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

MapInspector.prototype.inspectEntity = function(gameContext, entity) {
    this.showEntity(gameContext, entity);

    console.log("Inspected Entity", {
        "dName":  entity.getName(gameContext),
        "dDesc": entity.getDescription(gameContext),
        "entity": entity
    });
}

MapInspector.prototype.inspectBuilding = function(gameContext, building) {
    console.log("Inspected Building", {
        "building": building
    });
}

MapInspector.prototype.inspectTile = function(gameContext, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const name = worldMap.getTileName(gameContext, tileX, tileY);
    const desc = worldMap.getTileDesc(gameContext, tileX, tileY);
    const climateType = worldMap.getClimateType(gameContext, tileX, tileY);
    const tileType = worldMap.getTileType(gameContext, tileX, tileY);

    console.log("Inspected Tile", {
        "x": tileX,
        "y": tileY,
        "name": name,
        "desc": desc,
        "climate": climateType,
        "type": tileType
    });
}

MapInspector.prototype.showPath = function(autotiler, oPath, entityX, entityY) { 
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

MapInspector.prototype.getLastEntity = function(gameContext) {
    const { world } = gameContext;
    const entity = world.getEntityAt(this.lastX, this.lastY);

    return entity;
}

MapInspector.prototype.inspect = function(gameContext, inspector, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager } = world;

    //We MUST be inspecting a new tile!
    if(this.lastX !== tileX || this.lastY !== tileY) {
        this.state = MapInspector.STATE.NONE;
    }

    //Always update the last click.
    this.lastX = tileX;
    this.lastY = tileY;

    const entity = inspector.getVisibleEntity(gameContext, tileX, tileY);

    //If the tile has updated, then STATE will be NONE.
    //Entities only get inspected if the last inspect was NOT the same entity or the building on the tile.
    if(entity && this.state !== MapInspector.STATE.ENTITY && this.state !== MapInspector.STATE.BUILDING) {
        this.nodeMap.clear();
        entity.mGetNodeMap(gameContext, this.nodeMap);
        this.inspectEntity(gameContext, entity);   
        this.state = MapInspector.STATE.ENTITY;

        return this.state;
    }

    const worldMap = mapManager.getActiveMap();
    const building = worldMap.getBuilding(tileX, tileY);

    //A building was found and the last inspect was NOT a building.
    if(building && this.state !== MapInspector.STATE.BUILDING) {
        this.lastInspectedBuilding = building;
        this.inspectBuilding(gameContext, building);
        this.state = MapInspector.STATE.BUILDING;

        return this.state;
    }

    //A tile is the default inspection if there is no entity and no building.
    this.state = MapInspector.STATE.TILE;
    this.clearOverlays();
    this.inspectTile(gameContext, tileX, tileY);

    return this.state;
}

MapInspector.prototype.update = function(gameContext, inspector) {
    const { x, y } = getCursorTile(gameContext);
    let hoverChanged = false;

    if(x !== this.lastHoverX || y !== this.lastHoverY) {
        hoverChanged = true;
    }

    this.lastHoverX = x;
    this.lastHoverY = y;

    const entity = inspector.getVisibleEntity(gameContext, x, y);

    if(entity) {
        this.camera.updateCash(x, y, entity.cash);
    } else {
        this.camera.updateCash(-1, -1, 0);
    }

    return hoverChanged;
}