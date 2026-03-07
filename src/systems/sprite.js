import { transformTileToWorld } from "../../engine/math/transform2D.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { ATTACK_TYPE, DIRECTION, LAYER_TYPE, SCHEMA_TYPE } from "../enums.js";

const SPRITE_KEY = {    
    IDLE_RIGHT: "idle_right",
    IDLE_LEFT: "idle_left",
    IDLE_DOWN: "idle_down",
    IDLE_UP: "idle_up",
    FIRE_RIGHT: "fire_right",
    FIRE_LEFT: "fire_left",
    FIRE_DOWN: "fire_down",
    FIRE_UP: "fire_up",
    MOVE_RIGHT: "move_right",
    MOVE_LEFT: "move_left",
    MOVE_DOWN: "move_down",
    MOVE_UP: "move_up",
};

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

const getSpriteKey = function(state, direction) {
    switch(state) {
        case BattalionEntity.STATE.IDLE: {
            switch(direction) {
                case DIRECTION.NORTH: return SPRITE_KEY.IDLE_UP;
                case DIRECTION.EAST: return SPRITE_KEY.IDLE_RIGHT;
                case DIRECTION.SOUTH: return SPRITE_KEY.IDLE_DOWN;
                case DIRECTION.WEST: return SPRITE_KEY.IDLE_LEFT;
            }
            break;
        }
        case BattalionEntity.STATE.MOVE: {
            switch(direction) {
                case DIRECTION.NORTH: return SPRITE_KEY.MOVE_UP;
                case DIRECTION.EAST: return SPRITE_KEY.MOVE_RIGHT;
                case DIRECTION.SOUTH: return SPRITE_KEY.MOVE_DOWN;
                case DIRECTION.WEST: return SPRITE_KEY.MOVE_LEFT;
            }
            break;
        }
        case BattalionEntity.STATE.FIRE: {
            switch(direction) {
                case DIRECTION.NORTH: return SPRITE_KEY.FIRE_UP;
                case DIRECTION.EAST: return SPRITE_KEY.FIRE_RIGHT;
                case DIRECTION.SOUTH: return SPRITE_KEY.FIRE_DOWN;
                case DIRECTION.WEST: return SPRITE_KEY.FIRE_LEFT;
            }
            break;
        }
    }

    return SPRITE_KEY.IDLE_RIGHT;
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

export const createSchematicSprite = function(gameContext, spriteID, schema, layerID) {
    const { spriteManager } = gameContext;
    const { id, colorMap } = schema;

    if(id !== SCHEMA_TYPE.RED) {
        spriteManager.createCopyTexture(spriteID, id, colorMap);
    }

    return spriteManager.createSprite(spriteID, layerID, id);
}

export const updateBuildingSprite = function(gameContext, building) {
    const { spriteManager } = gameContext;
    const { schema } = building.getTeam(gameContext);
    const { id, colorMap } = schema;

    if(id !== SCHEMA_TYPE.RED) {
        spriteManager.createCopyTexture(building.config.sprite, id, colorMap);
    }

    spriteManager.updateSprite(building.spriteID, building.config.sprite, id);
}

export const updateEntitySprite = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const { spriteID, state, direction, config } = entity;
    const sprite = spriteManager.getSprite(spriteID);
    const spriteKey = getSpriteKey(state, direction);
    const spriteName = config.sprites[spriteKey];

    if(spriteName !== undefined) {
        const { schema } = entity.getTeam(gameContext);;
        const { id, colorMap } = schema;

        if(id !== SCHEMA_TYPE.RED) {
            spriteManager.createCopyTexture(spriteName, id, colorMap);
            spriteManager.updateSprite(spriteID, spriteName, id);
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

export const bufferEntitySprites = function(gameContext, entity, schema) {
    const { spriteManager } = gameContext;
    const { id, colorMap } = schema;

    if(id === SCHEMA_TYPE.RED) {
        return;
    }

    const spriteKeys = Object.values(SPRITE_KEY);

    for(const spriteKey of spriteKeys) {
        const spriteName = entity.config.sprites[spriteKey];

        if(spriteName !== undefined) {
            spriteManager.createCopyTexture(spriteName, id, colorMap);
        }
    }
}

export const setEntityPosition = function(gameContext, entity, positionX, positionY) {
    const { spriteManager } = gameContext;
    const { spriteID } = entity;
    const sprite = spriteManager.getSprite(spriteID);

    sprite.setPosition(positionX, positionY);
}

export const updateEntityPosition = function(gameContext, entity, deltaX, deltaY) {
    const { spriteManager } = gameContext;
    const { spriteID } = entity;
    const sprite = spriteManager.getSprite(spriteID);

    sprite.updatePosition(deltaX, deltaY);
}

export const getAnimationDuration = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const { spriteID } = entity;
    const sprite = spriteManager.getSprite(spriteID);

    return sprite.getTotalFrameTime();
}