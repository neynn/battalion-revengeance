import { createPurchseEntityIntent } from "../../action/actionHelper.js";
import { TRAIT_TYPE } from "../../enums.js";
import { Player } from "../player.js";
import { PlayerState } from "./playerState.js";

export const IdleState = function() {
    PlayerState.call(this);
}

IdleState.prototype = Object.create(PlayerState.prototype);
IdleState.prototype.constructor = IdleState;

IdleState.prototype.onEnter = function(gameContext, stateMachine, enterData) {
    const player = stateMachine.getContext();

    player.clearOverlays();
}

IdleState.prototype.onEntityClick = function(gameContext, stateMachine, entity, isAlly, isControlled) {
    if(isControlled && entity.isSelectable()) {
        stateMachine.setNextState(gameContext, Player.STATE.SELECT, { "entity": entity });
    }
}

IdleState.prototype.onBuildingClick = function(gameContext, stateMachine, building) {
    if(building.hasTrait(TRAIT_TYPE.SPAWNER)) {
        //TODO: Open and create SELECT menu.
        const ENTITY_ID = "TURRET";
        const { tileX, tileY } = building;
        const player = stateMachine.getContext();
        const request = createPurchseEntityIntent(tileX, tileY, ENTITY_ID);

        player.addIntent(request);
        stateMachine.setNextState(gameContext, Player.STATE.IDLE);
    }
}