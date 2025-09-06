import { ArmyEventHandler } from "../../../armyEventHandler.js";
import { EntitySellEvent } from "../../../events/entitySell.js";
import { AnimationSystem } from "../../../systems/animation.js";
import { Player } from "../player.js";
import { PlayerCursor } from "../playerCursor.js";
import { PlayerState } from "./playerState.js";

export const PlayerSellState = function() {}

PlayerSellState.prototype = Object.create(PlayerState.prototype);
PlayerSellState.prototype.constructor = PlayerSellState;

PlayerSellState.prototype.onEnter = function(gameContext, stateMachine, transition) {
    const player = stateMachine.getContext();

    this.showSellableObjects(gameContext, player);

    player.hideRange(gameContext);
    player.hideAttackers(gameContext);
}

PlayerSellState.prototype.onExit = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    this.hideSellableObjects(gameContext, player);
}

PlayerSellState.prototype.onUpdate = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    this.updateCursor(gameContext, player);

    player.hover.alignSpriteAuto(gameContext);
}

PlayerSellState.prototype.onClick = function(gameContext, stateMachine) {
    const { world } = gameContext;
    const { entityManager } = world;

    const player = stateMachine.getContext();
    const { hover } = player;
    const { state, currentTarget } = hover;

    switch(state) {
        case PlayerCursor.STATE.HOVER_ON_ENTITY: {
            const hasEntity = player.hasEntity(currentTarget);

            if(hasEntity) {
                const entity = entityManager.getEntity(currentTarget);

                this.openSellDialog(gameContext, player, entity);
            }

            break;
        }
    }
}

PlayerSellState.prototype.openSellDialog = function(gameContext, player, entity) {
    const { world, client } = gameContext;
    const { soundPlayer } = client;
    const { actionQueue, eventBus } = world;
    const isRunning = actionQueue.isRunning();

    if(isRunning) {
        return;
    }

    const sellItem = entity.config.sell;

    if(!sellItem) {
        return;
    }

    const { id, value } = sellItem;
    const willSell = confirm(`Sell ${entity.config.id} for ${value} ${id}`);

    if(willSell) {
        soundPlayer.play(player.config.sounds.sell);
        eventBus.emit(ArmyEventHandler.TYPE.ENTITY_SELL, EntitySellEvent.createEvent(entity.getID(), player.getID()));
    }
}

PlayerSellState.prototype.hideSellableObjects = function(gameContext, player) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entities } = player;

    for(const entityID of entities) {
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            AnimationSystem.stopSell(entity);
        }
    }
}

PlayerSellState.prototype.showSellableObjects = function(gameContext, player) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entities } = player;

    for(const entityID of entities) {
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            AnimationSystem.playSell(gameContext, entity);
        }
    }
}

PlayerSellState.prototype.updateCursor = function(gameContext, player) {
    const { hover } = player;
    const { state } = hover;

    switch(state) {
        case PlayerCursor.STATE.HOVER_ON_ENTITY: {
            const hoveredEntity = hover.getEntity(gameContext);
            const spriteKey = `${hoveredEntity.config.dimX}-${hoveredEntity.config.dimY}`;
            const spriteID = player.getSpriteType(Player.SPRITE_TYPE.ATTACK, spriteKey);

            hover.updateSprite(gameContext, spriteID);
            break;
        }
        default: {
            const spriteID = player.getSpriteType(Player.SPRITE_TYPE.ATTACK, "1-1");

            hover.updateSprite(gameContext, spriteID);
            break;
        }
    }
}   