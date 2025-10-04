import { UI_SONUD } from "../enums.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { ArmySprite } from "../init/armySprite.js";

/**
 * Collection of functions revolving around the animations.
 */
export const AnimationSystem = function() {}

AnimationSystem.SPRITE_ID = {
    MOVE: 0,
    CARD: 1,
    SELL: 2,
    ATTENTION: 3
};

AnimationSystem.FIRE_OFFSET = {
    ARTILLERY: 48,
    REGULAR: 12
};

AnimationSystem.SPRITE_TYPE = {
    SELECT: "cursor_move_1x1",
    DELAY: "icon_delay",
    ATTENTION: "icon_status_finished"
};

AnimationSystem.playIdle = function(gameContext, entityIDList) {
    const { world } = gameContext;
    const { entityManager } = world;
    
    for(const entityID of entityIDList) {
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            entity.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
        }
    }
}

AnimationSystem.playDeath = function(gameContext, entity) {
    const { spriteManager, transform2D } = gameContext;
    const spriteType = entity.getSpriteID(ArmyEntity.SPRITE_TYPE.DEATH);
    const deathAnimation = spriteManager.createSprite(spriteType, 1);

    if(deathAnimation) {
        const centerPosition = transform2D.transformTileToWorldCenter(entity.tileX, entity.tileY);
        const offsetPosition = transform2D.transformSizeToWorldOffsetCenter(entity.config.dimX, entity.config.dimY);
        const positionX = centerPosition.x + offsetPosition.x;
        const positionY = centerPosition.y + offsetPosition.y;

        deathAnimation.setPosition(positionX, positionY);
        deathAnimation.expire();
    }
  
    entity.playSound(gameContext, ArmyEntity.SOUND_TYPE.DEATH);
}

AnimationSystem.playFire = function(gameContext, targetObject, attackerIDList) {
    const { world, spriteManager, transform2D } = gameContext;
    const { entityManager } = world;
    const { id } = targetObject;
    const target = entityManager.getEntity(id);
    const targetSprite = target.sprite.getMainSprite();

    for(let i = 0; i < attackerIDList.length; i++) {
        const attacker = entityManager.getEntity(attackerIDList[i]);
        const weaponSprite = spriteManager.createSprite(attacker.config.sprites.weapon);

        if(weaponSprite) {
            const { x, y } = transform2D.transformSizeToRandomOffset(target.config.dimX, target.config.dimY, AnimationSystem.FIRE_OFFSET.REGULAR, AnimationSystem.FIRE_OFFSET.REGULAR);

            attacker.lookAtEntity(target);
            attacker.updateSpriteDirectonal(gameContext, ArmyEntity.SPRITE_TYPE.FIRE, ArmyEntity.SPRITE_TYPE.FIRE_UP);
            attacker.playSound(gameContext, ArmyEntity.SOUND_TYPE.FIRE);
            targetSprite.addChild(weaponSprite);
            weaponSprite.setPosition(x, y);
            weaponSprite.expire();
        }

        if(attacker.config.cost && attacker.config.cost.artillery !== 0) {
            const artillerySprite = spriteManager.createSprite(attacker.config.sprites.weapon);

            if(artillerySprite) {
                const { x, y } = transform2D.transformSizeToRandomOffset(target.config.dimX, target.config.dimY, AnimationSystem.FIRE_OFFSET.ARTILLERY, AnimationSystem.FIRE_OFFSET.ARTILLERY);

                targetSprite.addChild(artillerySprite);
                artillerySprite.setPosition(x, y);
                artillerySprite.flip();
                artillerySprite.expire();
            }
        }
    }
}


AnimationSystem.playSell = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const spriteType = `cursor_move_${entity.config.dimX}x${entity.config.dimY}`;
    const sellSprite = spriteManager.createSharedSprite(spriteType);
    
    if(sellSprite) {
        entity.sprite.setRender(ArmySprite.RENDER.OVERLAY, sellSprite, 0, 0);
    }
}

AnimationSystem.stopSell = function(entity) {
    entity.sprite.removeRender(ArmySprite.RENDER.OVERLAY);
}

AnimationSystem.playSelect = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const moveSprite = spriteManager.createSharedSprite(AnimationSystem.SPRITE_TYPE.SELECT);
    
     if(moveSprite) {
        entity.sprite.setRender(ArmySprite.RENDER.OVERLAY, moveSprite, 0, 0);
    }
    
    entity.playSound(gameContext, ArmyEntity.SOUND_TYPE.SELECT);
}

AnimationSystem.stopSelect = function(entity) {
    entity.sprite.removeRender(ArmySprite.RENDER.OVERLAY);
}

AnimationSystem.playCleaning = function(gameContext, tileX, tileY) {
    const { spriteManager, transform2D, client } = gameContext;
    const { soundPlayer } = client;
    const delaySprite = spriteManager.createSprite(AnimationSystem.SPRITE_TYPE.DELAY, 1);

    if(delaySprite) {
        const { x, y } = transform2D.transformTileToWorldCenter(tileX, tileY);

        delaySprite.expire();
        delaySprite.setPosition(x, y);
    }

    soundPlayer.playSound(UI_SONUD.BUTTON);
}

AnimationSystem.playDelay = function(gameContext, entity) {
    const { spriteManager, transform2D, client } = gameContext;
    const { soundPlayer } = client;
    const entitySprite = entity.sprite.getMainSprite();
    const delaySprite = spriteManager.createSprite(AnimationSystem.SPRITE_TYPE.DELAY);

    if(delaySprite) {
        const { x, y } = transform2D.transformSizeToWorldOffsetCenter(entity.config.dimX, entity.config.dimY);

        entitySprite.addChild(delaySprite);
        delaySprite.expire();
        delaySprite.setPosition(x, y);
    }

    soundPlayer.playSound(UI_SONUD.BUTTON);
}

AnimationSystem.playHeal = function(gameContext, entity) {
    const { spriteManager, transform2D, client } = gameContext;
    const { soundPlayer } = client;
    const entitySprite = entity.sprite.getMainSprite();
    const delaySprite = spriteManager.createSprite(AnimationSystem.SPRITE_TYPE.DELAY);

    if(delaySprite) {
        const { x, y } = transform2D.transformSizeToWorldOffsetCenter(entity.config.dimX, entity.config.dimY);

        entitySprite.addChild(delaySprite);
        delaySprite.expire();
        delaySprite.setPosition(x, y);
    }

    soundPlayer.playSound(UI_SONUD.HEAL);
}

AnimationSystem.playAttention = function(gameContext, entity) {
    const { spriteManager, transform2D } = gameContext;
    const attentionSprite = spriteManager.createSharedSprite(AnimationSystem.SPRITE_TYPE.ATTENTION);

    if(attentionSprite) {
        const { x, y } = transform2D.transformSizeToWorldOffsetCenter(entity.config.dimX, entity.config.dimY);

        entity.sprite.setRender(ArmySprite.RENDER.ATTENTION, attentionSprite, x, y);
    }
}

AnimationSystem.stopAttention = function(entity) {
    entity.sprite.removeRender(ArmySprite.RENDER.ATTENTION);
}

AnimationSystem.playConstruction = function(gameContext, entity) {
    const { spriteManager, transform2D } = gameContext;
    const entitySprite = entity.sprite.getMainSprite();
    const delaySprite = spriteManager.createSprite(AnimationSystem.SPRITE_TYPE.DELAY);

    if(delaySprite) {
        const { x, y } = transform2D.transformSizeToWorldOffsetCenter(entity.config.dimX, entity.config.dimY);

        entitySprite.addChild(delaySprite);
        delaySprite.expire();
        delaySprite.setPosition(x, y);
    }

    entity.playSound(gameContext, ArmyEntity.SOUND_TYPE.BUILD);
}

AnimationSystem.setConstructionFrame = function(entity) {
    const constructionComponent = entity.getComponent(ArmyEntity.COMPONENT.CONSTRUCTION);

    if(constructionComponent) {
        const entitySprite = entity.sprite.getMainSprite();
        const frame = constructionComponent.getFrame();
        
        entitySprite.setFrame(frame);
    }
}