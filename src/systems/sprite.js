import { transformTileToWorld } from "../../engine/math/transform2D.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { ATTACK_TYPE, DIRECTION, ENTITY_SPRITE, LAYER_TYPE, SCHEMA_TYPE } from "../enums.js";

const EFFECT_KEY = {
    DEATH: "death",
    FIRE: "fire",
    HEAL: "heal"
};

const DEFAULT_EFFECTS = {
    [EFFECT_KEY.DEATH]: "explosion",
    [EFFECT_KEY.HEAL]: "supply_attack",
    [EFFECT_KEY.FIRE]: "small_attack"
};

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

const getSpriteIndex = function(state, direction) {
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

    return SPRITE_TABLE[begin + direction];
}

const getEffect = function(entity, effectType) {
    let effectName = entity.config.effects[effectType];

    if(effectName === undefined) {
        effectName = DEFAULT_EFFECTS[effectType];
    }

    return effectName;
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

export const createSchematicSprite = function(gameContext, spriteID, color, layerID) {
    const { spriteManager, typeRegistry } = gameContext;
    const { id, colorMap } = typeRegistry.getSchemaType(color);

    if(id !== SCHEMA_TYPE.RED) {
        spriteManager.createCopyTexture(spriteID, id, colorMap);
    }

    return spriteManager.createSprite(spriteID, layerID, id);
}

export const updateBuildingSprite = function(gameContext, building) {
    const { spriteManager, typeRegistry } = gameContext;
    const color = building.color;
    const spriteType = building.config.sprite;
    const spriteID = building.spriteID;

    if(color !== SCHEMA_TYPE.RED) {
        const { colorMap } = typeRegistry.getSchemaType(color);

        spriteManager.createCopyTexture(spriteType, color, colorMap);
    }

    spriteManager.updateSprite(spriteID, spriteType, color);
}

export const updateEntitySprite = function(gameContext, entity) {
    const { spriteManager, typeRegistry } = gameContext;
    const { spriteID, state, direction, config } = entity;
    const sprite = spriteManager.getSprite(spriteID);
    const spriteIndex = getSpriteIndex(state, direction);
    const spriteName = config.sprites[spriteIndex];

    if(spriteName !== null) {
        const { color } = entity.getTeam(gameContext);

        if(color !== SCHEMA_TYPE.RED) {
            const { colorMap } = typeRegistry.getSchemaType(color);

            spriteManager.createCopyTexture(spriteName, color, colorMap);
            spriteManager.updateSprite(spriteID, spriteName, color);
        } else {
            spriteManager.updateSprite(spriteID, spriteName, SpriteManager.NO_VARIANT);
        }
    }

    if(state === BattalionEntity.STATE.FIRE) {
        sprite.lock();
    } else {
        sprite.unlock();
    }
}

export const playDeathEffect = function(gameContext, entity) {
    const { tileX, tileY } = entity;
    const effectName = getEffect(entity, EFFECT_KEY.DEATH);

    playSprite(gameContext, effectName, tileX, tileY);
}

export const playHealEffect = function(gameContext, entity, target) {
    const { tileX, tileY } = target;
    const effectName = getEffect(entity, EFFECT_KEY.HEAL);

    playSprite(gameContext, effectName, tileX, tileY);
}

export const playAttackEffect = function(gameContext, entity, target, resolutions) {
    const { world } = gameContext;
    const { entityManager } = world;
    const effectName = getEffect(entity, EFFECT_KEY.FIRE);
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