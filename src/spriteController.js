import { Texture } from "../engine/resources/texture/texture.js";
import { ImageResource } from "../engine/resources/texture/imageResource.js";
import { SpriteManager } from "../engine/sprite/spriteManager.js";
import { BattalionEntity } from "./entity/battalionEntity.js";
import { BUILDING_TYPE, COLOR_TYPE, DIRECTION, EFFECT_SPRITE, ENTITY_TYPE, LAYER_TYPE } from "./enums.js";
import { TeamManager } from "./team/teamManager.js";
import { TextureRegistry } from "../engine/resources/texture/textureRegistry.js";
import { MAX_BUILDINGS, MAX_UNITS } from "./constants.js";

//INFO(neyn): This is hard-coded but I don't really care :)
const BUILDING_NEUTRAL_COLORS = {
    //Base Sprite -> Gray Sprite
    0x661A5E: [68, 86, 65],
    0xAA162C: [128, 102, 104],
    0xE9332E: [177, 173, 123],
    0xFF9085: [238, 225, 156],

    //Gold Icon -> Gray Icon
    0x964E38: [35, 59, 84],
    0xE5C234: [95, 111, 101],
    0xFFE975: [125, 153, 138],
    0xFFFFDC: [173, 183, 170]
};

const MAX_SHADES = ENTITY_TYPE._COUNT * DIRECTION._COUNT;
const SPRITES_PER_ENTITY_TYPE = DIRECTION._COUNT * BattalionEntity.STATE._COUNT;
const EFFECTS_PER_ENTITY_TYPE = EFFECT_SPRITE._COUNT;

const ENTITY_EFFECT_COUNT = ENTITY_TYPE._COUNT * EFFECTS_PER_ENTITY_TYPE;
const ENTITY_SPRITE_COUNT = ENTITY_TYPE._COUNT * SPRITES_PER_ENTITY_TYPE;
const BUILDING_SPRITE_COUNT = BUILDING_TYPE._COUNT;

/**
 * 
 * @param {number} type 
 * @param {number} state 
 * @param {number} direction 
 * @returns 
 */
const getEntitySpriteIndex = function(type, state, direction) {
    if(type < 0 || type >= ENTITY_TYPE._COUNT) {
        return -1;
    }

    if(state < 0 || state >= BattalionEntity.STATE._COUNT) {
        return -1;
    }

    if(direction < 0 || direction >= DIRECTION._COUNT) {
        return -1;
    }

    return type * SPRITES_PER_ENTITY_TYPE + state * DIRECTION._COUNT + direction;
}


/**
 * 
 * @param {number} type 
 * @returns 
 */
const getBuildingSpriteIndex = function(type) {
    if(type < 0 || type >= BUILDING_TYPE._COUNT) {
        return -1;
    }

    return type;
}

/**
 * 
 * @param {number} type 
 * @param {number} effect 
 * @returns 
 */
const getEntityEffectIndex = function(type, effect) {
     if(type < 0 || type >= ENTITY_TYPE._COUNT) {
        return -1;
    }

    if(effect < 0 || effect >= EFFECT_SPRITE._COUNT) {
        return -1;
    }

    return type * EFFECTS_PER_ENTITY_TYPE + effect;
}

const effectNameToIndex = function(name, type) {
    switch(name) {
        case "death": return getEntityEffectIndex(type, EFFECT_SPRITE.DEATH);
        case "fire": return getEntityEffectIndex(type, EFFECT_SPRITE.FIRE);
        case "heal": return getEntityEffectIndex(type, EFFECT_SPRITE.HEAL);
        default: return -1;
    }
}

const spriteNameToIndex = function(name, type) {
    switch(name) {
        case "idle_up": return getEntitySpriteIndex(type, BattalionEntity.STATE.IDLE, DIRECTION.NORTH);
        case "idle_right": return getEntitySpriteIndex(type, BattalionEntity.STATE.IDLE, DIRECTION.EAST);
        case "idle_down": return getEntitySpriteIndex(type, BattalionEntity.STATE.IDLE, DIRECTION.SOUTH);
        case "idle_left": return getEntitySpriteIndex(type, BattalionEntity.STATE.IDLE, DIRECTION.WEST);
        case "move_up": return getEntitySpriteIndex(type, BattalionEntity.STATE.MOVE, DIRECTION.NORTH);
        case "move_right": return getEntitySpriteIndex(type, BattalionEntity.STATE.MOVE, DIRECTION.EAST);
        case "move_down": return getEntitySpriteIndex(type, BattalionEntity.STATE.MOVE, DIRECTION.SOUTH);
        case "move_left": return getEntitySpriteIndex(type, BattalionEntity.STATE.MOVE, DIRECTION.WEST);
        case "fire_up": return getEntitySpriteIndex(type, BattalionEntity.STATE.FIRE, DIRECTION.NORTH);
        case "fire_right": return getEntitySpriteIndex(type, BattalionEntity.STATE.FIRE, DIRECTION.EAST);
        case "fire_down": return getEntitySpriteIndex(type, BattalionEntity.STATE.FIRE, DIRECTION.SOUTH);
        case "fire_left": return getEntitySpriteIndex(type, BattalionEntity.STATE.FIRE, DIRECTION.WEST);
        default: return -1;
    }
}

export const SpriteController = function() {
    this.shades = [];
    this.buildingSprites = new Int16Array(MAX_BUILDINGS);
    this.unitSprites = new Int16Array(MAX_UNITS);

    this.entityEffectRegistry = new Int16Array(ENTITY_EFFECT_COUNT);
    this.entitySpriteRegistry = new Int16Array(ENTITY_SPRITE_COUNT);
    this.buildingSpriteRegistry = new Int16Array(BUILDING_SPRITE_COUNT);

    this.entityEffectRegistry.fill(-1);
    this.entitySpriteRegistry.fill(-1);
    this.buildingSpriteRegistry.fill(-1);

    for(let i = 0; i < MAX_SHADES; i++) {
        this.shades[i] = new ImageResource();
    }

    this.resetSprites();
}

SpriteController.prototype.getBuildingSpriteTypeID = function(type) {
    const index = getBuildingSpriteIndex(type);

    if(index === -1) {
        return -1;
    }

    return this.buildingSpriteRegistry[index];
}

SpriteController.prototype.getEntitySpriteTypeID = function(type, state, direction) {
    const index = getEntitySpriteIndex(type, state, direction);

    if(index === -1) {
        return -1;
    }

    return this.entitySpriteRegistry[index];
}

SpriteController.prototype.getEntityEffectTypeID = function(type, effect) {
    const index = getEntityEffectIndex(type, effect);

    if(index === -1) {
        return -1;
    }

    return this.entityEffectRegistry[index];
}

SpriteController.prototype.registerBuildingSprites = function(gameContext, buildingTypes) {
    const { spriteManager } = gameContext;

    for(const typeID in buildingTypes) {
        const rBuildingType = buildingTypes[typeID];
        const rSpriteName = rBuildingType.sprite;
        const index = BUILDING_TYPE[typeID];

        if(index !== undefined && rSpriteName !== undefined) {
            const spriteIndex = getBuildingSpriteIndex(index);

            this.buildingSpriteRegistry[index] = spriteManager.getSpriteID(rSpriteName);
        }
    }
}

SpriteController.prototype.registerEntitySprites = function(gameContext, entityTypes) {
    const { spriteManager } = gameContext;

    //Preloads default effects.
    const deathID = spriteManager.getSpriteID("explosion");
    const fireID = spriteManager.getSpriteID("small_attack");
    const healID = spriteManager.getSpriteID("supply_attack");

    for(let i = 0; i < ENTITY_TYPE._COUNT; i++) {
        const index = i * EFFECTS_PER_ENTITY_TYPE;

        this.entityEffectRegistry[index + EFFECT_SPRITE.DEATH] = deathID;
        this.entityEffectRegistry[index + EFFECT_SPRITE.FIRE] = fireID;
        this.entityEffectRegistry[index + EFFECT_SPRITE.HEAL] = healID;
    }

    for(const typeName in entityTypes) {
        const rEntityType = entityTypes[typeName];
        const rEntitySprites = rEntityType.sprites ?? {};
        const rEntityEffects = rEntityType.effects ?? {};
        const typeID = ENTITY_TYPE[typeName] ?? ENTITY_TYPE._INVALID;

        for(const spriteName in rEntitySprites) {
            const spriteIndex = spriteNameToIndex(spriteName, typeID);

            if(spriteIndex !== -1) {
                this.entitySpriteRegistry[spriteIndex] = spriteManager.getSpriteID(rEntitySprites[spriteName]);
            }
        }

        for(const effectName in rEntityEffects) {
            const effectIndex = effectNameToIndex(effectName, typeID);

            if(effectIndex !== -1) {
                this.entityEffectRegistry[effectIndex] = spriteManager.getSpriteID(rEntityEffects[effectName]);
            }
        }

        //If move is not present then idle is used!
        for(let i = 0; i < DIRECTION._COUNT; i++) {
            const moveIndex = getEntitySpriteIndex(typeID, BattalionEntity.STATE.MOVE, i);

            if(this.entitySpriteRegistry[moveIndex] === -1) {
                const idleIndex = getEntitySpriteIndex(typeID, BattalionEntity.STATE.IDLE, i);

                this.entitySpriteRegistry[moveIndex] = this.entitySpriteRegistry[idleIndex];
            }
        } 
    }
}

SpriteController.prototype.resetSprites = function() {
    for(let i = 0; i < MAX_BUILDINGS; i++) {
        this.buildingSprites[i] = SpriteManager.INVALID_ID;
    }

    for(let i = 0; i < MAX_UNITS; i++) {
        this.unitSprites[i] = SpriteManager.INVALID_ID;
    }
}

SpriteController.prototype.getShade = function(type, direction) {
    const index = type * DIRECTION._COUNT + direction;

    if(index < 0 || index >= MAX_SHADES) {
        return Texture.EMPTY_IMAGE;
    }

    return this.shades[index];
}

SpriteController.prototype.getBuildingSpriteID = function(index) {
    if(index < 0 || index >= MAX_BUILDINGS) {
        return SpriteManager.INVALID_ID;
    }

    return this.buildingSprites[index];
}

SpriteController.prototype.createBuildingSprite = function(gameContext, building) {
    const { spriteManager } = gameContext;
    const { index } = building;
    const spriteObject = spriteManager.createEmptySprite(LAYER_TYPE.BUILDING);
    const spriteIndex = spriteObject.getIndex();

    this.buildingSprites[index] = spriteIndex;
    this.updateBuildingSprite(gameContext, building, spriteIndex);
}

SpriteController.prototype.bufferBuildingSprites = function(gameContext, colors) {
    const { spriteManager, typeRegistry, textureLoader } = gameContext;
    const bufferedTextures = new Set();

    for(let i = 0; i < BUILDING_SPRITE_COUNT; i++) {
        const spriteTypeID = this.buildingSpriteRegistry[i];
        const textureID = spriteManager.getTextureID(spriteTypeID);

        if(textureID !== TextureRegistry.INVALID_ID && !bufferedTextures.has(textureID)) {
            textureLoader.addRecolorTask(textureID, COLOR_TYPE.BUILDING, BUILDING_NEUTRAL_COLORS);

            for(const colorID of colors) {
                if(colorID !== COLOR_TYPE.RED) {
                    const { colorMap } = typeRegistry.getColorType(colorID);

                    textureLoader.addRecolorTask(textureID, colorID, colorMap);
                }
            }

            bufferedTextures.add(textureID);
        }
    }
}

SpriteController.prototype.updateBuildingSprite = function(gameContext, building, spriteIndex) {
    const { spriteManager, typeRegistry, teamManager, textureLoader } = gameContext;
    const { teamID, config } = building;
    const spriteTypeID = this.getBuildingSpriteTypeID(config.id); 

    if(spriteTypeID === -1) {
        return;
    }

    const textureID = spriteManager.getTextureID(spriteTypeID);

    if(teamID === TeamManager.INVALID_ID) {
        textureLoader.addRecolorTask(textureID, COLOR_TYPE.BUILDING, BUILDING_NEUTRAL_COLORS);
        spriteManager.updateSprite(spriteIndex, spriteTypeID, COLOR_TYPE.BUILDING);
    } else {
        const { color } = teamManager.getTeam(teamID);

        if(color !== COLOR_TYPE.RED) {
            const { colorMap } = typeRegistry.getColorType(color);

            textureLoader.addRecolorTask(textureID, color, colorMap);
        }

        spriteManager.updateSprite(spriteIndex, spriteTypeID, color);
    }
}

SpriteController.prototype.getEntitySpriteID = function(index) {
    if(index < 0 || index >= MAX_UNITS) {
        return SpriteManager.INVALID_ID;
    }

    return this.unitSprites[index];
}

SpriteController.prototype.destroyEntitySprite = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const { index } = entity;
    const spriteID = this.getEntitySpriteID(index);

    spriteManager.destroySprite(spriteID);

    this.unitSprites[index] = SpriteManager.INVALID_ID;
}

SpriteController.prototype.createEntitySprite = function(gameContext, entity) {
    const { teamManager, spriteManager } = gameContext;
    const { teamID, config, index } = entity;
    const { id } = config;
    const { color } = teamManager.getTeam(teamID);
    const visualSprite = spriteManager.createEmptySprite(LAYER_TYPE.LAND);

    if(index >= 0 && index < MAX_UNITS) {
        this.unitSprites[index] = visualSprite.getIndex();
        this.bufferEntitySprites(gameContext, id, color);
        this.updateEntitySprite(gameContext, entity);
    }
}

SpriteController.prototype.updateEntitySprite = function(gameContext, entity) {
    const { spriteManager, typeRegistry, textureLoader } = gameContext;
    const { state, config, index, direction } = entity;
    const spriteID = this.getEntitySpriteID(index);

    if(spriteID === SpriteManager.INVALID_ID) {
        return;
    }

    const sprite = spriteManager.getSprite(spriteID);
    const spriteTypeID = this.getEntitySpriteTypeID(config.id, state, direction);

    if(spriteTypeID !== -1) {
        const textureID = spriteManager.getTextureID(spriteTypeID);
        const { color } = entity.getTeam(gameContext);

        if(color !== COLOR_TYPE.RED) {
            const { colorMap } = typeRegistry.getColorType(color);

            textureLoader.addRecolorTask(textureID, color, colorMap);
        }

        spriteManager.updateSprite(spriteID, spriteTypeID, color);
    }

    if(state === BattalionEntity.STATE.FIRE) {
        sprite.lock();
    } else {
        sprite.unlock();
    }
}

SpriteController.prototype.bufferEntitySprites = function(gameContext, typeID, colorID) {
    if(typeID < 0 || typeID >= ENTITY_TYPE._COUNT) {
        return;
    }
    
    const { spriteManager, typeRegistry, textureLoader } = gameContext;
    const beginIndex = typeID * SPRITES_PER_ENTITY_TYPE;

    if(colorID !== COLOR_TYPE.RED) {
        const { colorMap } = typeRegistry.getColorType(colorID);
        
        for(let i = 0; i < BattalionEntity.STATE._COUNT; i++) {
            for(let j = 0; j < DIRECTION._COUNT; j++) {
                const spriteTypeID = this.getEntitySpriteTypeID(typeID, i, j);
                const textureID = spriteManager.getTextureID(spriteTypeID);

                textureLoader.addRecolorTask(textureID, colorID, colorMap);
            }
        }
    }

    for(let i = 0; i < DIRECTION._COUNT; i++) {
        const shade = this.shades[typeID * DIRECTION._COUNT + i];

        if(shade.state === ImageResource.STATE.EMPTY) {
            const spriteTypeID = this.getEntitySpriteTypeID(typeID, BattalionEntity.STATE.IDLE, i);
            const container = spriteManager.getContainer(spriteTypeID);

            if(container && container.frameCount > 0) {
                textureLoader.addShadeTask(container.texture.id, container.frames[0], shade);
            }
        } 
    }
}

SpriteController.prototype.clearSprites = function(gameContext) {
    const { spriteManager } = gameContext;

    for(let i = 0; i < MAX_UNITS; i++) {
        const spriteID = this.unitSprites[i];

        if(spriteID !== SpriteManager.INVALID_ID) {
            spriteManager.destroySprite(spriteID);

            this.unitSprites[i] = SpriteManager.INVALID_ID;
        }
    }

    for(let i = 0; i < MAX_BUILDINGS; i++) {
        const spriteID = this.buildingSprites[i];

        if(spriteID !== SpriteManager.INVALID_ID) {
            spriteManager.destroySprite(spriteID);

            this.buildingSprites[i] = SpriteManager.INVALID_ID;
        }
    }
}

SpriteController.prototype.exit = function(gameContext) {
    for(let i = 0; i < MAX_SHADES; i++) {
        this.shades[i].clear();
    }

    this.clearSprites(gameContext);
}