import { EntityHelper } from "../../../engine/entity/entityHelper.js";
import { Player } from "../player.js";
import { PlayerState } from "./playerState.js";

export const IdleState = function() {
    PlayerState.call(this);
}

IdleState.prototype = Object.create(PlayerState.prototype);
IdleState.prototype.constructor = IdleState;

IdleState.prototype.onEnter = function(gameContext, stateMachine, enterData) {
    const player = stateMachine.getContext();

    player.clearNodeMapRender();
}

IdleState.prototype.onTileClick = function(gameContext, stateMachine, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    const test = {
        "x": tileX,
        "y": tileY,
        "terrain": worldMap.getTerrainTypes(gameContext, tileX, tileY),
        "climate": worldMap.getClimateType(gameContext, tileX, tileY),
        "type": worldMap.getTileType(gameContext, tileX, tileY),
        "name": worldMap.getTileName(gameContext, tileX, tileY),
        "desc": worldMap.getTileDesc(gameContext, tileX, tileY),
        "entity": EntityHelper.getTileEntity(gameContext, tileX, tileY)
    }

    console.log(test);
}

IdleState.prototype.onEntityClick = function(gameContext, stateMachine, entity, isAlly, isControlled) {
    if(isControlled && !entity.isDead()) {
        stateMachine.setNextState(gameContext, Player.STATE.SELECT, { "entity": entity });
    }
}