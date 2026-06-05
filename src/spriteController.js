import { transformTileToWorld } from "../engine/math/transform2D.js";
import { Texture } from "../engine/resources/texture/texture.js";
import { TextureHandle } from "../engine/resources/texture/textureHandle.js";
import { SpriteManager } from "../engine/sprite/spriteManager.js";
import { BattalionEntity } from "./entity/battalionEntity.js";
import { COLOR_TYPE, DIRECTION, ENTITY_SPRITE, ENTITY_TYPE, LAYER_TYPE } from "./enums.js";
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

const getEntitySpriteName = function(entity) {
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

export const SpriteController = function() {
    const MAX_SHADES = ENTITY_TYPE._COUNT * DIRECTION._COUNT;

    this.shades = [];
    this.bufferedSprites = new Uint8Array(ENTITY_TYPE._COUNT);

    for(let i = 0; i < MAX_SHADES; i++) {
        this.shades[i] = new TextureHandle();
    }
}

SpriteController.prototype.getShade = function(index) {
    if(index < 0 || index >= this.shades.length) {
        return Texture.EMPTY_HANDLE;
    }

    return this.shades[index];
}

SpriteController.prototype.destroyEntitySprite = function(gameContext, entity) {
    const { spriteManager } = gameContext;

    spriteManager.destroySprite(entity.spriteID);

    entity.spriteID = SpriteManager.INVALID_ID;
}

SpriteController.prototype.createEntitySprite = function(gameContext, entity) {
    const { teamManager, spriteManager } = gameContext;
    const { teamID } = entity;
    const { color } = teamManager.getTeam(teamID);
    const visualSprite = spriteManager.createEmptySprite(LAYER_TYPE.LAND);

    entity.spriteID = visualSprite.getIndex();

    this.bufferEntitySprites(gameContext, type, color);
    this.updateEntitySprite(gameContext, entity);
}

SpriteController.prototype.createBuildingSprite = function(gameContext, building) {
    const { spriteManager } = gameContext;
    const { tileX, tileY } = building;
    const position = transformTileToWorld(tileX, tileY);
    const spriteObject = spriteManager.createEmptySprite(LAYER_TYPE.BUILDING);
    const spriteIndex = spriteObject.getIndex();

    spriteObject.setPosition(position.x, position.y);

    building.spriteID = spriteIndex;

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

SpriteController.prototype.updateEntitySprite = function(gameContext, entity) {
    const { spriteManager, typeRegistry } = gameContext;
    const { spriteID, state, config } = entity;
    const sprite = spriteManager.getSprite(spriteID);
    const spriteName = getEntitySpriteName(entity);

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
    const { sprites } = typeRegistry.getEntityType(typeID);

    if(colorID !== COLOR_TYPE.RED) {
        const { id, colorMap } = typeRegistry.getColorType(colorID);
        
        for(const spriteIndex of SPRITE_TABLE) {
            const spriteName = sprites[spriteIndex];
    
            if(spriteName !== null) {
                spriteManager.createCopyTexture(spriteName, id, colorMap);
            }
        }

        if(typeID >= 0 && typeID < ENTITY_TYPE._COUNT) {
            this.bufferedSprites[typeID] = colorID;
        }
    }

    for(let i = 0; i < DIRECTION._COUNT; i++) {
        const shade = this.shades[typeID * DIRECTION._COUNT + i];

        if(shade.state === TextureHandle.STATE.EMPTY) {
            const spriteIndex = ENTITY_SPRITE.IDLE_UP + i;
            const spriteName = sprites[spriteIndex];

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
            console.log(i)
        }
    }
}