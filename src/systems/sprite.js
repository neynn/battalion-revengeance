import { transformTileToWorld } from "../../engine/math/transform2D.js";
import { Texture } from "../../engine/resources/texture/texture.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { ATTACK_TYPE, DIRECTION, EFFECT_SPRITE, ENTITY_SPRITE, LAYER_TYPE, COLOR_TYPE } from "../enums.js";
import { TeamManager } from "../team/teamManager.js";

export const playSprite = function(gameContext, spriteType, tileX, tileY) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.createSprite(spriteType, LAYER_TYPE.GFX);
    const { x, y } = transformTileToWorld(tileX, tileY);

    sprite.setPosition(x, y);
    sprite.expire();
}

export const playExplosion = function(gameContext, tileX, tileY) {
    const { client } = gameContext;
    const { soundPlayer } = client;

    soundPlayer.play("explosion");

    playSprite(gameContext, "explosion", tileX, tileY);
}

export const playDeathEffect = function(gameContext, entity) {
    const { tileX, tileY, config } = entity;
    const effectName = config.effects[EFFECT_SPRITE.DEATH];

    playSprite(gameContext, effectName, tileX, tileY);
}

export const playHealEffect = function(gameContext, entity, target) {
    const { tileX, tileY } = target;
    const effectName = entity.config.effects[EFFECT_SPRITE.HEAL];

    playSprite(gameContext, effectName, tileX, tileY);
}

export const playAttackEffect = function(gameContext, entity, target, resolutions) {
    const { world } = gameContext;
    const { entityManager } = world;
    const effectName = entity.config.effects[EFFECT_SPRITE.FIRE];
    const attackType = entity.getAttackType();

    switch(attackType) {
        case ATTACK_TYPE.DISPERSION: {
            const { tileX, tileY } = target;

            playSprite(gameContext, effectName, tileX, tileY);
            break;
        }
        default: {
            for(const { health, entityID } of resolutions) {
                const target = entityManager.getEntity(entityID);

                if(target !== entity && entity.canSee(gameContext, target)) {
                    const { tileX, tileY } = target;

                    playSprite(gameContext, effectName, tileX, tileY);
                }
            }

            break;
        }
    }
}

export const getAnimationDuration = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const { spriteID } = entity;
    const sprite = spriteManager.getSprite(spriteID);

    return sprite.getTotalFrameTime();
}