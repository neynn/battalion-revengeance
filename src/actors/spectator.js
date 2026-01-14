import { getCursorTile } from "../../engine/camera/contextHelper.js";
import { Autotiler } from "../../engine/tile/autotiler.js";
import { BattalionActor } from "./battalionActor.js";
import { isNodeReachable } from "../systems/pathfinding.js";
import { TILE_ID } from "../enums.js";

export const Spectator = function(id, camera) {
    BattalionActor.call(this, id);

    this.tileX = -1;
    this.tileY = -1;
    this.camera = camera;
    this.lastInspectedEntity = null;
}

Spectator.prototype = Object.create(BattalionActor.prototype);
Spectator.prototype.constructor = Spectator;

Spectator.prototype.inspectEntity = function(gameContext, entity) {
    this.showJammer(gameContext, entity);
    this.lastInspectedEntity = entity;

    console.log("Inspected Entity", {
        "dName":  entity.getName(gameContext),
        "dDesc": entity.getDescription(gameContext),
        "entity": entity
    });
}

Spectator.prototype.inspectTile = function(gameContext, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const name = worldMap.getTileName(gameContext, tileX, tileY);
    const desc = worldMap.getTileDesc(gameContext, tileX, tileY);
    const terrainTypes = worldMap.getTerrainTypes(gameContext, tileX, tileY);
    const climateType = worldMap.getClimateType(gameContext, tileX, tileY);
    const tileType = worldMap.getTileType(gameContext, tileX, tileY);

    this.lastInspectedEntity = null;
    this.camera.jammerOverlay.clear();

    console.log("Inspected Tile", {
        "x": tileX,
        "y": tileY,
        "name": name,
        "desc": desc,
        "terrain": terrainTypes,
        "climate": climateType,
        "type": tileType
    });
}

Spectator.prototype.onClick = function(gameContext, worldMap, tileX, tileY) {
    const { world } = gameContext;
    const entity = world.getEntityAt(tileX, tileY);

    if(entity) {
        if(this.lastInspectedEntity === entity) {
            this.inspectTile(gameContext, tileX, tileY);
        } else {
            this.inspectEntity(gameContext, entity);        
        }

        return;
    }

    const building = worldMap.getBuilding(tileX, tileY);

    if(building) {
        //Inspect building? Treat it as tile for inspection?
        return;
    }

    this.inspectTile(gameContext, tileX, tileY);
}

Spectator.prototype.loadKeybinds = function(gameContext) {
    const { client } = gameContext;
    const { router } = client;
    
    router.bind(gameContext, "SPECTATOR");
    router.on("CLICK", () => {
        const { world } = gameContext;
        const { mapManager } = world;
        const worldMap = mapManager.getActiveMap();

        if(worldMap) {
            const { x, y } = getCursorTile(gameContext);

            this.onClick(gameContext, worldMap, x, y);
        }
    });
}

Spectator.prototype.showJammer = function(gameContext, entity) {
    if(entity.isJammer()) {
        const { tileX, tileY } = entity;

        this.showJammerAt(gameContext, entity, tileX, tileY);
    } else {
        this.camera.jammerOverlay.clear();
    }
}

Spectator.prototype.showJammerAt = function(gameContext, entity, jammerX, jammerY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const jammerRange = entity.config.jammerRange;

    this.camera.jammerOverlay.clear();

    worldMap.fill2DGraph(jammerX, jammerY, jammerRange, (nextX, nextY) => {
        this.camera.jammerOverlay.add(TILE_ID.JAMMER, nextX, nextY);
    });
}

Spectator.prototype.update = function(gameContext) {
    if(this.lastInspectedEntity && this.lastInspectedEntity.isDestroyed()) {
        //TODO: Un-Inspect entity!
        this.lastInspectedEntity = null;
    }

    const { x, y } = getCursorTile(gameContext);

    if(x !== this.tileX || y !== this.tileY) {
        //TILE CHANGED!
    }

    this.tileX = x;
    this.tileY = y;
}

Spectator.prototype.clearOverlays = function() {
    this.camera.selectOverlay.clear();
    this.camera.pathOverlay.clear();
    this.camera.jammerOverlay.clear();
}

Spectator.prototype.addNodeMapRender = function(nodeMap) {
    this.clearOverlays();

    for(const [index, node] of nodeMap) {
        const { x, y } = node;
        const id = isNodeReachable(node) ? TILE_ID.OVERLAY_MOVE : TILE_ID.OVERLAY_ATTACK;

        this.camera.selectOverlay.add(id, x, y);
    }
}

Spectator.prototype.showPath = function(autotiler, oPath, entityX, entityY) { 
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