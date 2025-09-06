import { HealAction } from "../../../actions/healAction.js";
import { HealSystem } from "../../../systems/heal.js";
import { Player } from "../player.js";
import { PlayerCursor } from "../playerCursor.js";
import { PlayerState } from "./playerState.js";

export const PlayerHealState = function() {}

PlayerHealState.prototype = Object.create(PlayerState.prototype);
PlayerHealState.prototype.constructor = PlayerHealState;

PlayerHealState.prototype.onEnter = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    player.hideRange(gameContext);
    player.hideAttackers(gameContext);
}

PlayerHealState.prototype.onUpdate = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();
    const { hover } = player;

    this.updateCursor(gameContext, player);
    hover.alignSpriteAuto(gameContext);
}

PlayerHealState.prototype.onClick = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();
    const { hover } = player;
    const { currentTarget } = hover;
    const isValid = this.isValid(gameContext, player);

    if(isValid) {
        this.queueHeal(player, currentTarget);
    } else {
        const { client } = gameContext;
        const { soundPlayer } = client;
        
        soundPlayer.play(player.config.sounds.error, 0.5);
    }

    stateMachine.setNextState(gameContext, Player.STATE.IDLE);
}

PlayerHealState.prototype.queueHeal = function(player, entityID) {
    const playerID = player.getID();
    const request = HealAction.createRequest(playerID, entityID);

    player.inputQueue.enqueueLast(request);
}

PlayerHealState.prototype.isValid = function(gameContext, player) {
    const { hover } = player;
    const { state } = hover;

    if(state !== PlayerCursor.STATE.HOVER_ON_ENTITY) {
        return false;
    }

    const entity = hover.getEntity(gameContext);
    const isHealable = HealSystem.isEntityHealableBy(entity, player);

    return isHealable;
}

PlayerHealState.prototype.updateCursor = function(gameContext, player) {
    const { hover } = player;
    const { state } = hover;

    switch(state) {
        case PlayerCursor.STATE.HOVER_ON_ENTITY: {
            const hoveredEntity = hover.getEntity(gameContext);
            const spriteKey = `${hoveredEntity.config.dimX}-${hoveredEntity.config.dimY}`;
            const spriteID = player.getSpriteType(Player.SPRITE_TYPE.REPAIR, spriteKey);

            hover.updateSprite(gameContext, spriteID);
            break;
        }
        default: {
            const spriteID = player.getSpriteType(Player.SPRITE_TYPE.REPAIR, "1-1");

            hover.updateSprite(gameContext, spriteID);
            break;
        }
    }
}   