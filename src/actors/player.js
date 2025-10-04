import { ContextHelper } from "../../engine/camera/contextHelper.js";
import { EntityHelper } from "../../engine/entity/entityHelper.js";
import { BattalionActor } from "./battalionActor.js";

export const Player = function(id, config) {
    BattalionActor.call(this, id);

    this.config = config;
    this.camera = null;
    this.selectedEntity = null;
    this.selectionState = Player.SELECTION_STATE.NONE;
}

Player.SELECTION_STATE = {
    NONE: 0,
    INSPECT: 1,
    SELECTED: 2,
    CONTEXT_MENU: 3
};

Player.ACTION = {
    CLICK: "CLICK"
};

Player.prototype = Object.create(BattalionActor.prototype);
Player.prototype.constructor = Player;

Player.prototype.setCamera = function(camera) {
    this.camera = camera;
}

Player.prototype.closeContextMenu = function() {
    if(this.selectionState === Player.SELECTION_STATE.CONTEXT_MENU) {
        this.deselectEntity();

        console.log("Context menu closed");
    }
}

Player.prototype.openContextMenu = function() {
    if(this.selectedEntity !== null) {
        if(this.selectionState === Player.SELECTION_STATE.CONTEXT_MENU) {
            this.closeContextMenu();
        } else {
            this.selectionState = Player.SELECTION_STATE.CONTEXT_MENU;

            console.log("Context menu opened");
        }
    }
}

Player.prototype.inspectEntity = function(gameContext, entity) {
    this.selectionState = Player.SELECTION_STATE.INSPECT;

    console.log("Inspected Entity", entity);
}

Player.prototype.selectEntity = function(gameContext, entity) {
    const entityID = entity.getID();

    this.selectionState = Player.SELECTION_STATE.SELECTED;
    this.selectedEntity = entityID;

    console.log("Selected Entity", entity);
}

Player.prototype.deselectEntity = function() {
    this.selectionState = Player.SELECTION_STATE.NONE;
    this.selectedEntity = null;

    console.log("Deselected Entity", entity);
}

Player.prototype.onEntityClick = function(gameContext, entity) {
    const { teamManager } = gameContext;
    const { teamID } = entity;
    const entityID = entity.getID();

    if(this.hasEntity(entityID)) {
        if(this.selectedEntity === entityID) {
            this.openContextMenu();
        } else if(entity.isSelectable()) {
            this.closeContextMenu();
            this.selectEntity(gameContext, entity);
        }
    } else {
        if(!teamManager.isAlly(this.teamID, teamID)) {
            if(this.selectedEntity !== null) {
                console.log("Attacked Entity", entity)
            } else {
                this.closeContextMenu();
                this.inspectEntity(gameContext, entity);
            }
        } else {
            this.closeContextMenu();
            this.inspectEntity(gameContext, entity);
        }

        this.deselectEntity();
    }
}

Player.prototype.onBuildingClick = function(gameContext, building) {
    console.log(building);
}

Player.prototype.onClick = function(gameContext, worldMap, tile) {
    const { x, y } = tile;
    const entity = EntityHelper.getTileEntity(gameContext, x, y);

    if(entity) {
        this.onEntityClick(gameContext, entity);
        return;
    }

    //TODO: When clicking on a building/tile do a move if an entity is selected.
    this.closeContextMenu();

    const building = worldMap.getBuilding(x, y);

    if(building) {
        this.onBuildingClick(gameContext, building);
        return;
    }

    const test = {
        "x": x,
        "y": y,
        "terrain": worldMap.getTerrainTags(gameContext, x, y),
        "climate": worldMap.getClimateType(gameContext, x, y),
        "type": worldMap.getTileType(gameContext, x, y),
        "name": worldMap.getTileName(gameContext, x, y),
        "desc": worldMap.getTileDesc(gameContext, x, y),
        "entity": EntityHelper.getTileEntity(gameContext, x, y)
    }

    //this.requestTurnEnd();
    console.log(test);
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

            this.onClick(gameContext, worldMap, tile);
        }
    });
}

Player.prototype.activeUpdate = function(gameContext, remainingActions) {}

Player.prototype.onNextTurn = function(gameContext, turn) {
    console.log("IT IS TURN " + turn);
}

Player.prototype.onNextRound = function(gameContext, round) {
    console.log("IT IS ROUND " + round);
}