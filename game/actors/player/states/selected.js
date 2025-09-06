import { EntityManager } from "../../../../engine/entity/entityManager.js";
import { AnimationSystem } from "../../../systems/animation.js";
import { PlayerCursor } from "../playerCursor.js";
import { Player } from "../player.js";
import { MoveAction } from "../../../actions/moveAction.js";
import { PlayerState } from "./playerState.js";
import { PlayCamera } from "../../../camera/playCamera.js";

export const PlayerSelectedState = function() {
    this.entityID = EntityManager.ID.INVALID;
}

PlayerSelectedState.prototype = Object.create(PlayerState.prototype);
PlayerSelectedState.prototype.constructor = PlayerSelectedState;

PlayerSelectedState.prototype.onEnter = function(gameContext, stateMachine, transition) {
    const player = stateMachine.getContext();
    const { entityID } = transition;

    player.showAttackers();
    player.showRange();

    this.entityID = entityID;
}

PlayerSelectedState.prototype.onExit = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();
        
    this.deselectEntity(gameContext, player);
}

PlayerSelectedState.prototype.onUpdate = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();
    const { hover } = player;

    this.updateEntity(gameContext, player);
    this.updateCursor(gameContext, player);
    hover.alignSpriteAuto(gameContext);
}

PlayerSelectedState.prototype.updateEntity = function(gameContext, player) {
    const { world } = gameContext;
    const { entityManager } = world;
    const selectedEntity = entityManager.getEntity(this.entityID);

    if(selectedEntity) {
        const hoverTileX = player.hover.tileX;
        
        if(hoverTileX !== selectedEntity.tileX) {
            selectedEntity.lookHorizontal(hoverTileX < selectedEntity.tileX);
            selectedEntity.updateSpriteHorizontal();
        }
    }
}

PlayerSelectedState.prototype.updateCursor = function(gameContext, player) {
    const { hover } = player;
    const { state } = hover;

    switch(state) {
        case PlayerCursor.STATE.HOVER_ON_ENTITY: {
            const hoveredEntity = hover.getEntity(gameContext);
            const spriteType = player.getCursorType(hoveredEntity.config.dimX, hoveredEntity.config.dimY);

            hover.updateSprite(gameContext, spriteType);
            break;
        }
        case PlayerCursor.STATE.HOVER_ON_NODE: {
            const spriteID = player.getSpriteType(Player.SPRITE_TYPE.MOVE, "1-1");

            hover.updateSprite(gameContext, spriteID);
            break;
        }
        default: {
            hover.hideSprite(gameContext);
            break;
        }
    }
}

PlayerSelectedState.prototype.deselectEntity = function(gameContext, player) {
    const { world } = gameContext;
    const { entityManager } = world;
    const entity = entityManager.getEntity(this.entityID);

    if(entity) {
        AnimationSystem.stopSelect(entity);
    }

    player.camera.clearOverlay(PlayCamera.OVERLAY.MOVE);
    player.hover.clearNodes();

    this.entityID = EntityManager.ID.INVALID;
}

PlayerSelectedState.prototype.onClick = function(gameContext, stateMachine) {
    const { client } = gameContext;
    const { soundPlayer } = client;
    const player = stateMachine.getContext();
    const { hover } = player;
    const { state, tileX, tileY, currentTarget } = hover;

    switch(state) {
        case PlayerCursor.STATE.HOVER_ON_ENTITY: {
            const mouseEntity = hover.getEntity(gameContext);
            const isAttackable = mouseEntity.isAttackableByTeam(gameContext, player.teamID);

            if(isAttackable) {
                player.queueAttack(currentTarget);
            } else {
                soundPlayer.play(player.config.sounds.error, 0.5); 
            }

            break;
        }
        case PlayerCursor.STATE.HOVER_ON_NODE: {
            const playerID = player.getID();
            const request = MoveAction.createRequest(playerID, this.entityID, tileX, tileY);

            player.inputQueue.enqueueLast(request);
            break;
        }
        default: {
            soundPlayer.play(player.config.sounds.error, 0.5); 
            break;
        }
    }

    stateMachine.setNextState(gameContext, Player.STATE.IDLE);
}