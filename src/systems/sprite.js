import { transformTileToWorld } from "../../engine/math/transform2D.js";
import { Texture } from "../../engine/resources/texture/texture.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { ATTACK_TYPE, DIRECTION, EFFECT_SPRITE, LAYER_TYPE, COLOR_TYPE } from "../enums.js";
import { TeamManager } from "../team/teamManager.js";

export const playSprite = function(gameContext, spriteType, tileX, tileY) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.createSprite(spriteType, LAYER_TYPE.GFX);
    const { x, y } = transformTileToWorld(tileX, tileY);

    sprite.setPosition(x, y);
    sprite.expire();
}

export const playExplosion = function(gameContext, tileX, tileY) {
    const { client, spriteManager } = gameContext;
    const { soundPlayer } = client;
    const spriteID = spriteManager.getSpriteDefinitionID("explosion");

    soundPlayer.play("explosion");

    playSprite(gameContext, spriteID, tileX, tileY);
}

export const playDeathEffect = function(gameContext, entity) {
    const { spriteRegistry } = gameContext;
    const { tileX, tileY, config } = entity;
    const spriteID = spriteRegistry.getUnitEffectSpriteDefinitionID(config.id, EFFECT_SPRITE.DEATH);

    playSprite(gameContext, spriteID, tileX, tileY);
}

export const playHealEffect = function(gameContext, entity, target) {
    const { spriteRegistry } = gameContext;
    const { tileX, tileY, config } = target;
    const spriteID = spriteRegistry.getUnitEffectSpriteDefinitionID(config.id, EFFECT_SPRITE.HEAL);

    playSprite(gameContext, spriteID, tileX, tileY);
}

export const playAttackEffect = function(gameContext, entity, target, resolutions) {
    const { world, spriteRegistry } = gameContext;
    const { entityManager } = world;
    const attackType = entity.getAttackType();
    const spriteID = spriteRegistry.getUnitEffectSpriteDefinitionID(entity.config.id, EFFECT_SPRITE.FIRE);

    switch(attackType) {
        case ATTACK_TYPE.DISPERSION: {
            const { tileX, tileY } = target;

            playSprite(gameContext, spriteID, tileX, tileY);
            break;
        }
        default: {
            for(const { health, entityID } of resolutions) {
                const target = entityManager.getEntity(entityID);

                if(target !== entity && entity.canSee(gameContext, target)) {
                    const { tileX, tileY } = target;

                    playSprite(gameContext, spriteID, tileX, tileY);
                }
            }

            break;
        }
    }
}

export const getAnimationDuration = function(gameContext, entity) {
    const { spriteManager, spriteRegistry } = gameContext;
    const { index } = entity;
    const spriteID = spriteRegistry.getEntitySpriteID(index);

    if(spriteID === SpriteManager.INVALID_ID) {
        return 0;
    }
    
    const sprite = spriteManager.getSprite(spriteID);

    return sprite.getTotalFrameTime();
}