import { EntityHelper } from "../../../engine/entity/entityHelper.js";
import { Player } from "../player.js";
import { PlayerState } from "./playerState.js";

export const IdleState = function() {
    PlayerState.call(this);
}

IdleState.prototype = Object.create(PlayerState.prototype);
IdleState.prototype.constructor = IdleState;

IdleState.prototype.onTileClick = function(gameContext, stateMachine, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    const test = {
        "x": tileX,
        "y": tileY,
        "terrain": worldMap.getTerrainTags(gameContext, tileX, tileY),
        "climate": worldMap.getClimateType(gameContext, tileX, tileY),
        "type": worldMap.getTileType(gameContext, tileX, tileY),
        "name": worldMap.getTileName(gameContext, tileX, tileY),
        "desc": worldMap.getTileDesc(gameContext, tileX, tileY),
        "entity": EntityHelper.getTileEntity(gameContext, tileX, tileY)
    }

    console.log(test);
}

IdleState.prototype.onEntityClick = function(gameContext, stateMachine, entity, isAlly, isControlled) {
    if(isControlled && entity.isSelectable()) {
        stateMachine.setNextState(gameContext, Player.STATE.SELECT, { "entity": entity });
        return;
    }
}

/*
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
*/