import { Texture } from "../engine/resources/texture/texture.js";
import { ImageResource } from "../engine/resources/texture/imageResource.js";
import { SpriteManager } from "../engine/sprite/spriteManager.js";
import { BattalionEntity } from "./entity/battalionEntity.js";
import { COLOR_TYPE, DIRECTION, ENTITY_STATE, ENTITY_TYPE, LAYER_TYPE } from "./enums.js";
import { TeamManager } from "./team/teamManager.js";

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

const MAX_ENTITY_SPRITES = 1000;
const MAX_BUILDING_SPRITES = 100;

const MAX_SHADES = ENTITY_TYPE._COUNT * DIRECTION._COUNT;
const SPRITES_PER_TYPE = DIRECTION._COUNT * ENTITY_STATE._COUNT;
const ENTITY_SPRITE_COUNT = ENTITY_TYPE._COUNT * SPRITES_PER_TYPE;

/**
 * 
 * @param {number} type 
 * @param {number} state 
 * @param {number} direction 
 * @returns 
 */
const getSpriteIndex = function(type, state, direction) {
    if(type < 0 || type >= ENTITY_TYPE._COUNT) {
        return -1;
    }

    if(state < 0 || state >= ENTITY_STATE._COUNT) {
        return -1;
    }

    if(direction < 0 || direction >= DIRECTION._COUNT) {
        return -1;
    }

    return type * SPRITES_PER_TYPE + state * DIRECTION._COUNT + direction;
}

const spriteNameToIndex = function(name, type) {
    switch(name) {
        case "idle_up": return getSpriteIndex(type, ENTITY_STATE.IDLE, DIRECTION.NORTH);
        case "idle_right": return getSpriteIndex(type, ENTITY_STATE.IDLE, DIRECTION.EAST);
        case "idle_down": return getSpriteIndex(type, ENTITY_STATE.IDLE, DIRECTION.SOUTH);
        case "idle_left": return getSpriteIndex(type, ENTITY_STATE.IDLE, DIRECTION.WEST);
        case "move_up": return getSpriteIndex(type, ENTITY_STATE.MOVE, DIRECTION.NORTH);
        case "move_right": return getSpriteIndex(type, ENTITY_STATE.MOVE, DIRECTION.EAST);
        case "move_down": return getSpriteIndex(type, ENTITY_STATE.MOVE, DIRECTION.SOUTH);
        case "move_left": return getSpriteIndex(type, ENTITY_STATE.MOVE, DIRECTION.WEST);
        case "fire_up": return getSpriteIndex(type, ENTITY_STATE.FIRE, DIRECTION.NORTH);
        case "fire_right": return getSpriteIndex(type, ENTITY_STATE.FIRE, DIRECTION.EAST);
        case "fire_down": return getSpriteIndex(type, ENTITY_STATE.FIRE, DIRECTION.SOUTH);
        case "fire_left": return getSpriteIndex(type, ENTITY_STATE.FIRE, DIRECTION.WEST);
        default: return -1;
    }
}

export const SpriteController = function() {
    this.shades = [];
    this.buildingSprites = new Int16Array(MAX_BUILDING_SPRITES);
    this.entitySprites = new Int16Array(MAX_ENTITY_SPRITES);
    this.entitySpriteList = new Int16Array(ENTITY_SPRITE_COUNT);

    for(let i = 0; i < MAX_SHADES; i++) {
        this.shades[i] = new ImageResource();
    }

    for(let i = 0; i < ENTITY_SPRITE_COUNT; i++) {
        this.entitySpriteList[i] = -1;
    }

    this.resetSprites();
}

SpriteController.prototype.getEntitySpriteTypeID = function(type, state, direction) {
    const index = getSpriteIndex(type, state, direction);

    if(index === -1) {
        return -1;
    }

    return this.entitySpriteList[index];
}

SpriteController.prototype.registerEntitySprites = function(gameContext, entityTypes) {
    const { spriteManager } = gameContext;

    for(const typeID in entityTypes) {
        const rEntityType = entityTypes[typeID];
        const rEntitySprites = rEntityType.sprites ?? {};
        const index = ENTITY_TYPE[typeID] ?? ENTITY_TYPE._INVALID;

        for(const spriteName in rEntitySprites) {
            const spriteIndex = spriteNameToIndex(spriteName, index);

            if(spriteIndex !== -1) {
                this.entitySpriteList[spriteIndex] = spriteManager.getSpriteID(rEntitySprites[spriteName]);
            }
        }

        //If move is not present then idle is used!
        for(let i = 0; i < DIRECTION._COUNT; i++) {
            const moveIndex = getSpriteIndex(index, ENTITY_STATE.MOVE, i);

            if(this.entitySpriteList[moveIndex] === -1) {
                const idleIndex = getSpriteIndex(index, ENTITY_STATE.IDLE, i);

                this.entitySpriteList[moveIndex] = this.entitySpriteList[idleIndex];
            }
        } 
    }
}

SpriteController.prototype.resetSprites = function() {
    for(let i = 0; i < MAX_BUILDING_SPRITES; i++) {
        this.buildingSprites[i] = SpriteManager.INVALID_ID;
    }

    for(let i = 0; i < MAX_ENTITY_SPRITES; i++) {
        this.entitySprites[i] = SpriteManager.INVALID_ID;
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
    if(index < 0 || index >= MAX_BUILDING_SPRITES) {
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

SpriteController.prototype.updateBuildingSprite = function(gameContext, building, spriteIndex) {
    const { spriteManager, typeRegistry, teamManager } = gameContext;
    const { teamID, config } = building;
    const { sprite } = config;

    if(teamID === TeamManager.INVALID_ID) {
        spriteManager.createCopyTexture(sprite, COLOR_TYPE.BUILDING, BUILDING_NEUTRAL_COLORS);
        spriteManager.updateSprite(spriteIndex, sprite, COLOR_TYPE.BUILDING);
    } else {
        const { color } = teamManager.getTeam(teamID);

        if(color !== COLOR_TYPE.RED) {
            const { colorMap } = typeRegistry.getColorType(color);

            spriteManager.createCopyTexture(sprite, color, colorMap);
        }

        spriteManager.updateSprite(spriteIndex, sprite, color);
    }
}

SpriteController.prototype.getEntitySpriteID = function(index) {
    if(index < 0 || index >= MAX_ENTITY_SPRITES) {
        return SpriteManager.INVALID_ID;
    }

    return this.entitySprites[index];
}

SpriteController.prototype.destroyEntitySprite = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const { index } = entity;
    const spriteID = this.getEntitySpriteID(index);

    spriteManager.destroySprite(spriteID);

    this.entitySprites[index] = SpriteManager.INVALID_ID;
}

SpriteController.prototype.createEntitySprite = function(gameContext, entity) {
    const { teamManager, spriteManager } = gameContext;
    const { teamID, config, index } = entity;
    const { id } = config;
    const { color } = teamManager.getTeam(teamID);
    const visualSprite = spriteManager.createEmptySprite(LAYER_TYPE.LAND);

    if(index >= 0 && index < MAX_ENTITY_SPRITES) {
        this.entitySprites[index] = visualSprite.getIndex();
        this.bufferEntitySprites(gameContext, id, color);
        this.updateEntitySprite(gameContext, entity);
    }
}

SpriteController.prototype.updateEntitySprite = function(gameContext, entity) {
    const { spriteManager, typeRegistry } = gameContext;
    const { state, config, index, direction } = entity;
    const spriteID = this.getEntitySpriteID(index);

    if(spriteID === SpriteManager.INVALID_ID) {
        return;
    }

    const sprite = spriteManager.getSprite(spriteID);
    const spriteTypeID = this.getEntitySpriteTypeID(config.id, state, direction);

    if(spriteTypeID !== -1) {
        const { color } = entity.getTeam(gameContext);

        if(color !== COLOR_TYPE.RED) {
            const { colorMap } = typeRegistry.getColorType(color);

            spriteManager.createCopyTexture(spriteTypeID, color, colorMap);
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
    
    const { spriteManager, typeRegistry } = gameContext;
    const beginIndex = typeID * SPRITES_PER_TYPE;

    if(colorID !== COLOR_TYPE.RED) {
        const { colorMap } = typeRegistry.getColorType(colorID);
        
        for(let i = 0; i < ENTITY_STATE._COUNT; i++) {
            for(let j = 0; j < DIRECTION._COUNT; j++) {
                const spriteTypeID = this.getEntitySpriteTypeID(typeID, i, j);

                spriteManager.createCopyTexture(spriteTypeID, colorID, colorMap);
            }
        }
    }

    for(let i = 0; i < DIRECTION._COUNT; i++) {
        const shade = this.shades[typeID * DIRECTION._COUNT + i];

        if(shade.state === ImageResource.STATE.EMPTY) {
            const spriteTypeID = this.getEntitySpriteTypeID(typeID, ENTITY_STATE.IDLE, i);

            spriteManager.createShadeTask(spriteTypeID, shade);
        } 
    }
}

SpriteController.prototype.exit = function(gameContext) {
    for(let i = 0; i < MAX_SHADES; i++) {
        this.shades[i].clear();
    }
}