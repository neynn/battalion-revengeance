import { ContextHelper } from "../../engine/camera/contextHelper.js";
import { EntityHelper } from "../../engine/entity/entityHelper.js";
import { BattalionActor } from "./battalionActor.js";

export const Player = function(id, config) {
    BattalionActor.call(this, id);

    this.config = config;
    this.camera = null;
    this.selectedEntity = null;
    this.inspectedEntity = null;

    this.selectionState = Player.SELECTION_STATE.NONE;
}

Player.SELECTION_STATE = {
    NONE: 0,
    SELECTED: 1,
    CONTEXT_MENU: 2
};

Player.ACTION = {
    CLICK: "CLICK"
};

Player.prototype = Object.create(BattalionActor.prototype);
Player.prototype.constructor = Player;

Player.prototype.setCamera = function(camera) {
    this.camera = camera;
}

Player.prototype.inspectEntity = function(gameContext, entity) {
    this.inspectedEntity = entity;

    const displayName = entity.getDisplayName(gameContext);
    const displayDesc = entity.getDisplayDesc(gameContext);

    console.log(displayName, displayDesc);
    console.log("Inspected Entity", entity);
}

Player.prototype.onOwnEntitySelect = function(gameContext, entity) {
    if(this.selectedEntity === entity) {
        switch(this.selectionState) {
            case Player.SELECTION_STATE.SELECTED: {
                console.log("Opened context menu");
                //TODO: give context menu the entity and callbacks.
                this.selectedEntity = null;
                this.selectionState = Player.SELECTION_STATE.CONTEXT_MENU;
                break;
            }
            case Player.SELECTION_STATE.CONTEXT_MENU: {
                //Close only the context menu.
                this.selectedEntity = null;
                this.selectionState = Player.SELECTION_STATE.NONE;
                break;
            }
        }
    } else {
        switch(this.selectionState) {
            case Player.SELECTION_STATE.NONE: {
                this.selectedEntity = entity; //Show tiles.
                this.selectionState = Player.SELECTION_STATE.SELECTED;
                break;
            }
            case Player.SELECTION_STATE.SELECTED: { //Show tiles.
                this.selectedEntity = entity;
                this.selectionState = Player.SELECTION_STATE.SELECTED;
                break;
            }
            case Player.SELECTION_STATE.CONTEXT_MENU: {
                this.selectedEntity = entity; //Show tiles.
                this.selectionState = Player.SELECTION_STATE.SELECTED;
                break;
            }
        }
    }
}

Player.prototype.onOtherEnemyEntitySelect = function(gameContext, entity) {
    switch(this.selectionState) {
        case Player.SELECTION_STATE.NONE: {
            //Show the tiles of enemy entity.
            break;
        }
        case Player.SELECTION_STATE.SELECTED: {
            console.log("Attacked entity");
            this.selectedEntity = null;
            this.selectionState = Player.SELECTION_STATE.NONE;
            break;
        }
        case Player.SELECTION_STATE.CONTEXT_MENU: {
            //Just close the context menu.
            break;
        }
    }   
}

Player.prototype.onOtherAllyEntitySelect = function(gameContext, entity) {
    switch(this.selectionState) {
        case Player.SELECTION_STATE.NONE: {
            //Show tiles of friendly entity.
            break;
        }
        case Player.SELECTION_STATE.SELECTED: {
            //Show tiles of friendly entity.
            this.selectedEntity = null;
            this.selectionState = Player.SELECTION_STATE.NONE;
            break;
        }
        case Player.SELECTION_STATE.CONTEXT_MENU: {
            //Close the context menu AND show tiles of friendly entity.
            break;
        }
    }
}

Player.prototype.onEntityClick = function(gameContext, entity) {
    const { teamManager } = gameContext;
    const { teamID } = entity;
    const entityID = entity.getID();

    if(this.inspectedEntity === entity) {
        this.inspectedEntity = null;
        console.log("inspected terrain");
    } else {
        this.inspectEntity(gameContext, entity);        
    }

    //Clear visible tiles.

    if(this.hasEntity(entityID)) {
        if(entity.isSelectable()) {
            this.onOwnEntitySelect(gameContext, entity);
        }
    } else {
        if(!teamManager.isAlly(this.teamID, teamID)) {
            this.onOtherEnemyEntitySelect(gameContext, entity);
        } else {
            this.onOtherAllyEntitySelect(gameContext, entity);
        }
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