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

export const SpriteController = function() {
    const MAX_SHADES = ENTITY_TYPE._COUNT * DIRECTION._COUNT;

    this.shades = [];
    this.bufferedSprites = new Uint8Array(ENTITY_TYPE._COUNT);
    this.buildingSprites = new Int16Array(MAX_BUILDING_SPRITES);
    this.entitySprites = new Int16Array(MAX_ENTITY_SPRITES);

    for(let i = 0; i < MAX_SHADES; i++) {
        this.shades[i] = new ImageResource();
    }

    this.resetSprites();
}

SpriteController.prototype.resetSprites = function() {
    for(let i = 0; i < MAX_BUILDING_SPRITES; i++) {
        this.buildingSprites[i] = SpriteManager.INVALID_ID;
    }

    for(let i = 0; i < MAX_ENTITY_SPRITES; i++) {
        this.entitySprites[i] = SpriteManager.INVALID_ID;
    }
}

SpriteController.prototype.getShade = function(index) {
    if(index < 0 || index >= this.shades.length) {
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
    const spriteName = config.getSpriteID(state, direction);

    if(spriteName !== null) {
        const { color } = entity.getTeam(gameContext);

        if(color !== COLOR_TYPE.RED) {
            const { colorMap } = typeRegistry.getColorType(color);

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

SpriteController.prototype.bufferEntitySprites = function(gameContext, typeID, colorID) {
    const { spriteManager, typeRegistry } = gameContext;
    const entityType = typeRegistry.getEntityType(typeID);
    const { sprites } = entityType;

    if(colorID !== COLOR_TYPE.RED) {
        const { colorMap } = typeRegistry.getColorType(colorID);
        
        for(const spriteName of sprites) {
            if(spriteName !== null) {
                spriteManager.createCopyTexture(spriteName, colorID, colorMap);
            }
        }

        if(typeID >= 0 && typeID < ENTITY_TYPE._COUNT) {
            this.bufferedSprites[typeID] = colorID;
        }
    }

    for(let i = 0; i < DIRECTION._COUNT; i++) {
        const shade = this.shades[typeID * DIRECTION._COUNT + i];

        if(shade.state === ImageResource.STATE.EMPTY) {
            const spriteName = entityType.getSpriteID(ENTITY_STATE.IDLE, i);

            if(spriteName) {
                spriteManager.createShadeTask(spriteManager.getSpriteID(spriteName), shade);
            }
        } 
    }
}

SpriteController.prototype.exit = function(gameContext) {
    const { typeRegistry } = gameContext;

    for(let i = 0; i < this.shades.length; i++) {
        this.shades[i].clear();
    }

    for(let i = 0; i < ENTITY_TYPE._COUNT; i++) {
        if(this.bufferedSprites[i] !== COLOR_TYPE.RED) {
            const { sprites } = typeRegistry.getEntityType(i);

            for(const spriteName of sprites) {
                //TODO(neyn): Unload Texture!
            }
            
            this.bufferedSprites[i] = COLOR_TYPE.RED;
        }
    }
}