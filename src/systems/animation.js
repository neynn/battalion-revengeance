import { ATTACK_TYPE, LAYER_TYPE } from "../enums.js";

export const playGFX = function(gameContext, spriteType, tileX, tileY) {
    const { spriteManager, transform2D } = gameContext;
    const sprite = spriteManager.createSprite(spriteType, LAYER_TYPE.GFX);

    if(sprite) {
        const { x, y } = transform2D.transformTileToWorld(tileX, tileY);

        sprite.setPosition(x, y);
        sprite.expire();
    }
}

export const playExplosion = function(gameContext, tileX, tileY) {
    const { client } = gameContext;
    const { soundPlayer } = client;

    soundPlayer.play("explosion");
    playGFX(gameContext, "explosion", tileX, tileY);
}

export const playHealEffect = function(gameContext, entity, target) {
    const effectType = entity.getHealEffect();
    const { tileX, tileY } = target;

    playGFX(gameContext, effectType, tileX, tileY);
}

export const playAttackEffect = function(gameContext, entity, target, resolutions) {
    const { world } = gameContext;
    const { entityManager } = world;
    const effectType = entity.getAttackEffect();
    const attackType = entity.getAttackType();

    switch(attackType) {
        case ATTACK_TYPE.DISPERSION: {
            const { tileX, tileY } = target;

            playGFX(gameContext, effectType, tileX, tileY);
            break;
        }
        default: {
            for(const { health, entityID } of resolutions) {
                const target = entityManager.getEntity(entityID);
                const { tileX, tileY } = target;

                if(target !== entity && entity.canSee(gameContext, target)) {
                    playGFX(gameContext, effectType, tileX, tileY);
                }
            }

            break;
        }
    }
}