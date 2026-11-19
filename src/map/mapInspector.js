import { getCursorTile } from "../../engine/camera/contextHelper.js";
import { WorldMap } from "../../engine/map/worldMap.js";

const tryInspectTile = function(gameContext, actor, tileX, tileY) {
    const { world } = gameContext;
    const worldMap = world.getWorldMap();
    const index = worldMap.getIndex(tileX, tileY);
    let isValid = false;

    if(index !== WorldMap.OUT_OF_BOUNDS) {
        isValid = true;
    }

    return isValid;
}

const tryInspectMine = function(gameContext, actor, tileX, tileY) {
    const { world } = gameContext;
    const worldMap = world.getWorldMap();
    const mine = worldMap.getMine(tileX, tileY);
    let isValid = false;

    if(mine && mine.isVisibleTo(gameContext, actor.teamID)) {
        console.log("Inspected Mine", {
            "mine": mine
        });

        isValid = true;
    }

    return isValid;
}

const tryInspectBuilding = function(gameContext, actor, tileX, tileY) {
    const { world } = gameContext;
    const worldMap = world.getWorldMap();
    const building = worldMap.getBuilding(tileX, tileY);
    let isValid = false;

    if(building) {
        console.log("Inspected Building", {
            "building": building
        });

        isValid = true;
    }

    return isValid;
}

const tryInspectEntity = function(gameContext, actor, tileX, tileY) {
    const entity = actor.getVisibleEntity(gameContext, tileX, tileY);
    let isValid = false;

    if(entity) {
        console.log("Inspected Entity", {
            "dName":  entity.getName(gameContext),
            "dDesc": entity.getDescription(gameContext),
            "entity": entity
        });

        isValid = true;
    }

    return isValid;
}

export const MapInspector = function() {
    this.lastX = -1;
    this.lastY = -1;
    this.lastHoverX = -1;
    this.lastHoverY = -1;
    this.state = MapInspector.STATE.NONE;
    this.previousState = MapInspector.STATE.NONE;
    this.isEnabled = true;
    this.inspectionLevel = 0;
    this.lastInspectedEntity = null;
    
    this.hasEntityBeenRemoved = false;
    this.hasStateChanged = false;
    this.hasTileChanged = false;
}

MapInspector.INSPECT_LEVEL = {
    ENTITY: 0,
    BUILDING: 1,
    MINE: 2,
    TILE: 3
};

MapInspector.STATE = {
    NONE: 0,
    TILE: 1,
    MINE: 2,
    BUILDING: 3,
    ENTITY: 4,
    ENTITY_MENU: 5
};

const Inspectors = [
    tryInspectEntity,
    tryInspectBuilding,
    tryInspectMine,
    tryInspectTile
];

const InspectorStates = [
    MapInspector.STATE.ENTITY,
    MapInspector.STATE.BUILDING,
    MapInspector.STATE.MINE,
    MapInspector.STATE.TILE
]

MapInspector.prototype.setState = function(state) {
    this.previousState = this.state;
    this.state = state;

    if(this.previousState !== this.state) {
        this.hasStateChanged = true;
    }
}

MapInspector.prototype.checkStateChange = function() {
    let hasStateChanged = this.hasStateChanged;

    if(this.hasStateChanged) {
        this.hasStateChanged = false;
    }

    return hasStateChanged;
}

MapInspector.prototype.disable = function() {
    this.isEnabled = false;
}

MapInspector.prototype.enable = function() {
    this.isEnabled = true;
}

MapInspector.prototype.getLastMine = function(gameContext) {
    const { world } = gameContext;
    const worldMap = world.getWorldMap();
    const building = worldMap.getMine(this.lastX, this.lastY);

    return building;
}

MapInspector.prototype.getLastBuilding = function(gameContext) {
    const { world } = gameContext;
    const worldMap = world.getWorldMap();
    const building = worldMap.getBuilding(this.lastX, this.lastY);

    return building;
}

MapInspector.prototype.getLastEntity = function(gameContext) {
    const { world } = gameContext;
    const entity = world.getEntityAt(this.lastX, this.lastY);

    return entity;
}

MapInspector.prototype.canSwitchToMenu = function(gameContext, actor) {
    if(this.state !== MapInspector.STATE.ENTITY) {
        return false;
    }

    if(!this.lastInspectedEntity) {
        return false;
    }

    if(this.lastInspectedEntity !== this.getLastEntity(gameContext)) {
        return false;
    }

    if(!this.lastInspectedEntity.belongsTo(actor.teamID)) {
        return false;
    }

    if(!this.lastInspectedEntity.isSelectable()) {
        return false;
    }

    return true;
}

MapInspector.prototype.inspect = function(gameContext, actor, tileX, tileY) {
    if(!this.isEnabled) {
        this.state = MapInspector.STATE.NONE;
        return;
    }

    //We MUST be inspecting a new tile!
    if(this.lastX !== tileX || this.lastY !== tileY) {
        this.setState(MapInspector.STATE.NONE);
        this.inspectionLevel = 0;
        this.lastX = tileX;
        this.lastY = tileY;
    } else {
        if(this.canSwitchToMenu(gameContext, actor)) {
            this.setState(MapInspector.STATE.ENTITY_MENU);
            return;
        }

        this.inspectionLevel++;

        if(this.inspectionLevel >= Inspectors.length) {
            this.inspectionLevel = 0;
        }
    }

    let isValid = false;

    for(let i = this.inspectionLevel; i < Inspectors.length; i++) {
        if(Inspectors[i](gameContext, actor, tileX, tileY)) {
            this.inspectionLevel = i;
            this.setState(InspectorStates[i]);

            isValid = true;
            break;
        }
    }

    if(this.inspectionLevel === MapInspector.INSPECT_LEVEL.ENTITY) {
        this.lastInspectedEntity = this.getLastEntity(gameContext);
    }

    if(!isValid) {
        this.setState(MapInspector.STATE.NONE);
        this.inspectionLevel = 0;
    }
}

MapInspector.prototype.updateHover = function(gameContext) {
    const { x, y } = getCursorTile(gameContext);

    this.hasEntityBeenRemoved = false;
    this.hasTileChanged = false;

    if(x !== this.lastHoverX || y !== this.lastHoverY) {
        this.hasTileChanged = true;
    }

    this.lastHoverX = x;
    this.lastHoverY = y;

    //The entity was killed in between frames.
    if(this.inspectionLevel === MapInspector.INSPECT_LEVEL.ENTITY && this.getLastEntity(gameContext) === null) {
        this.setState(MapInspector.STATE.NONE);
        this.lastInspectedEntity = null;
        this.hasEntityBeenRemoved = true;
    }

    if(this.inspectionLevel === MapInspector.INSPECT_LEVEL.MINE && this.getLastMine(gameContext) === null) {
        this.setState(MapInspector.STATE.NONE);
    }
}