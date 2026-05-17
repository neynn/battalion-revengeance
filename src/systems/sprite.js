import { transformTileToWorld } from "../../engine/math/transform2D.js";
import { Texture } from "../../engine/resources/texture/texture.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { ATTACK_TYPE, DIRECTION, EFFECT_SPRITE, ENTITY_SPRITE, LAYER_TYPE, SCHEMA_TYPE } from "../enums.js";
import { TeamManager } from "../team/teamManager.js";

const SPRITE_TABLE = [
    ENTITY_SPRITE.IDLE_UP,
    ENTITY_SPRITE.IDLE_RIGHT,
    ENTITY_SPRITE.IDLE_DOWN,
    ENTITY_SPRITE.IDLE_LEFT,
    ENTITY_SPRITE.MOVE_UP,
    ENTITY_SPRITE.MOVE_RIGHT,
    ENTITY_SPRITE.MOVE_DOWN,
    ENTITY_SPRITE.MOVE_LEFT,
    ENTITY_SPRITE.FIRE_UP,
    ENTITY_SPRITE.FIRE_RIGHT,
    ENTITY_SPRITE.FIRE_DOWN,
    ENTITY_SPRITE.FIRE_LEFT
];

export const getEntitySpriteID = function(entity) {
    const { state, direction, config } = entity;
    const { sprites } = config;

    let begin = ENTITY_SPRITE.IDLE_UP;

    switch(state) {
        case BattalionEntity.STATE.IDLE: {
            begin = ENTITY_SPRITE.IDLE_UP;
            break;            
        }
        case BattalionEntity.STATE.MOVE: {
            begin = ENTITY_SPRITE.MOVE_UP;
            break;            
        }
        case BattalionEntity.STATE.FIRE: {
            begin = ENTITY_SPRITE.FIRE_UP;
            break;            
        }
    }

    return sprites[SPRITE_TABLE[begin + direction]];
}

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

export const updateBuildingSprite = function(gameContext, building, spriteIndex) {
    const { spriteManager, typeRegistry, teamManager } = gameContext;
    const { teamID, config } = building;
    const { sprite, neutralSprite } = config;

    if(teamID === TeamManager.INVALID_ID) {
        spriteManager.updateSprite(spriteIndex, neutralSprite);
    } else {
        const { color } = teamManager.getTeam(teamID);

        if(color !== SCHEMA_TYPE.RED) {
            const { colorMap } = typeRegistry.getSchemaType(color);

            spriteManager.createCopyTexture(sprite, color, colorMap);
        }

        spriteManager.updateSprite(spriteIndex, sprite, color);
    }
}

export const updateEntitySprite = function(gameContext, entity) {
    const { spriteManager, typeRegistry } = gameContext;
    const { spriteID, state, config } = entity;
    const sprite = spriteManager.getSprite(spriteID);
    const spriteName = getEntitySpriteID(entity);

    if(spriteName !== null) {
        const { color } = entity.getTeam(gameContext);

        if(color !== SCHEMA_TYPE.RED) {
            const { colorMap } = typeRegistry.getSchemaType(color);

            spriteManager.createCopyTexture(spriteName, color, colorMap);
        }

        spriteManager.updateSprite(spriteID, spriteName, color);
    }

    if(state === BattalionEntity.STATE.FIRE) {
        sprite.lock();
    } else {
        sprite.unlock();
    }
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

export const bufferEntitySprites = function(gameContext, entity, colorID) {
    if(colorID === SCHEMA_TYPE.RED) {
        return;
    }

    const { spriteManager, typeRegistry } = gameContext;
    const { id, colorMap } = typeRegistry.getSchemaType(colorID);

    for(const spriteIndex of SPRITE_TABLE) {
        const spriteName = entity.config.sprites[spriteIndex];

        if(spriteName !== null) {
            spriteManager.createCopyTexture(spriteName, id, colorMap);
        }
    }
}

export const getAnimationDuration = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const { spriteID } = entity;
    const sprite = spriteManager.getSprite(spriteID);

    return sprite.getTotalFrameTime();
}