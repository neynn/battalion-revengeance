import { getCursorTile } from "../../../engine/camera/contextHelper.js";
import { WorldMap } from "../../../engine/map/worldMap.js";

export const MapInspector = function() {
    this.lastX = -1;
    this.lastY = -1;
    this.lastHoverX = -1;
    this.lastHoverY = -1;
    this.state = MapInspector.STATE.NONE;
    this.nodeMap = new Map();
    this.isEnabled = true;
}

MapInspector.STATE = {
    NONE: 0,
    TILE: 1,
    BUILDING: 2,
    ENTITY: 3
};

MapInspector.prototype.disable = function() {
    this.isEnabled = false;
}

MapInspector.prototype.enable = function() {
    this.isEnabled = true;
}

MapInspector.prototype.getLastBuilding = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const building = worldMap.getBuilding(this.lastX, this.lastY);

    return building;
}

MapInspector.prototype.getLastEntity = function(gameContext) {
    const { world } = gameContext;
    const entity = world.getEntityAt(this.lastX, this.lastY);

    return entity;
}

MapInspector.prototype.inspect = function(gameContext, actor, camera, tileX, tileY) {
    if(!this.isEnabled) {
        return MapInspector.STATE.NONE;
    }

    const { world } = gameContext;
    const { mapManager } = world;

    //We MUST be inspecting a new tile!
    if(this.lastX !== tileX || this.lastY !== tileY) {
        this.state = MapInspector.STATE.NONE;
    }

    //Always update the last click.
    this.lastX = tileX;
    this.lastY = tileY;

    const entity = actor.getVisibleEntity(gameContext, tileX, tileY);

    //If the tile has updated, then STATE will be NONE.
    //Entities only get inspected if the last inspect was NOT the same entity or the building on the tile.
    if(entity && this.state !== MapInspector.STATE.ENTITY && this.state !== MapInspector.STATE.BUILDING) {
        this.nodeMap.clear();
        this.state = MapInspector.STATE.ENTITY;

        entity.mGetNodeMap(gameContext, this.nodeMap);
        camera.showEntityNodes(gameContext, entity, this.nodeMap);

        console.log("Inspected Entity", {
            "dName":  entity.getName(gameContext),
            "dDesc": entity.getDescription(gameContext),
            "entity": entity
        });

        return this.state;
    }

    const worldMap = mapManager.getActiveMap();
    const building = worldMap.getBuilding(tileX, tileY);

    //A building was found and the last inspect was NOT a building.
    if(building && this.state !== MapInspector.STATE.BUILDING) {
        this.state = MapInspector.STATE.BUILDING;

        console.log("Inspected Building", {
            "building": building
        });

        return this.state;
    }

    const index = worldMap.getIndex(this.lastX, this.lastY);

    camera.clearOverlays();

    this.state = index !== WorldMap.OUT_OF_BOUNDS ? MapInspector.STATE.TILE : MapInspector.STATE.NONE;

    return this.state;
}

MapInspector.prototype.update = function(gameContext, camera) {
    const { x, y } = getCursorTile(gameContext);
    let hoverChanged = false;

    if(x !== this.lastHoverX || y !== this.lastHoverY) {
        hoverChanged = true;
    }

    this.lastHoverX = x;
    this.lastHoverY = y;

    camera.setInspect(x, y);

    //The entity was deleted in between frames.
    if(this.state === MapInspector.STATE.ENTITY && this.getLastEntity(gameContext) === null) {
        this.state = MapInspector.STATE.NONE;

        camera.clearOverlays();
    }

    return hoverChanged;
}