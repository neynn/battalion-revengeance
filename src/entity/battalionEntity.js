import { Entity } from "../../engine/entity/entity.js";
import { LanguageHandler } from "../../engine/language/languageHandler.js";
import { isRectangleRectangleIntersect } from "../../engine/math/math.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const BattalionEntity = function(id, sprite) {
    Entity.call(this, id, "");

    this.hp = 1;
    this.maxHP = 1;
    this.damage = 0;
    this.range = 0;
    this.speed = 0;
    this.morale = 0;
    this.weaponType = TypeRegistry.WEAPON_TYPE.NONE;
    this.armorType = TypeRegistry.ARMOR_TYPE.NONE;
    this.movementType = TypeRegistry.MOVEMENT_TYPE.STATIONARY;
    this.customName = null;
    this.customDesc = null;
    this.customID = null;
    this.sprite = sprite;
    this.tileX = -1;
    this.tileY = -1;
    this.direction = BattalionEntity.DIRECTION.EAST;
    this.state = BattalionEntity.STATE.IDLE;
    this.teamID = null;
    this.traits = [];
}

BattalionEntity.DIRECTION_TYPE = {
    NORTH: "NORTH",
    EAST: "EAST",
    SOUTH: "SOUTH",
    WEST: "WEST"
};

BattalionEntity.DIRECTION = {
    NORTH: 1 << 0,
    EAST: 1 << 1,
    SOUTH: 1 << 2,
    WEST: 1 << 3
};

BattalionEntity.STATE = {
    IDLE: 0,
    MOVE: 1,
    FIRE: 2
};

BattalionEntity.SPRITE_TYPE = {
    IDLE_RIGHT: "idle_right",
    IDLE_LEFT: "idle_left",
    IDLE_DOWN: "idle_down",
    IDLE_UP: "idle_up",
    FIRE_RIGHT: "fire_right",
    FIRE_LEFT: "fire_left",
    FIRE_DOWN: "fire_down",
    FIRE_UP: "fire_up",
};

BattalionEntity.prototype = Object.create(Entity.prototype);
BattalionEntity.prototype.constructor = BattalionEntity;

BattalionEntity.prototype.setCustomText = function(name, desc) {
    if(name) {
        this.customName = name;
    }

    if(desc) {
        this.customDesc = desc;
    }
}

BattalionEntity.prototype.getDisplayDesc = function(gameContext) {
    const { language } = gameContext;
    
    if(this.customDesc) {
        return language.get(this.customDesc, LanguageHandler.TAG_TYPE.MAP);
    }

    const sharedTag = this.config.desc;

    if(sharedTag) {
        return language.get(sharedTag);
    }

    return language.get("MISSING_ENTITY_DESC");
}

BattalionEntity.prototype.getDisplayName = function(gameContext) {
    const { language } = gameContext;
    
    if(this.customName) {
        return language.get(this.customName, LanguageHandler.TAG_TYPE.MAP);
    }

    const sharedTag = this.config.name;

    if(sharedTag) {
        return language.get(sharedTag);
    }

    return language.get("MISSING_ENTITY_NAME");
}

BattalionEntity.prototype.setCustomID = function(id) {
    this.customID = id;
}

BattalionEntity.prototype.removeTraits = function() {
    this.traits.length = 0;
}

BattalionEntity.prototype.hasTrait = function(traitID) {
    for(let i = 0; i < this.traits.length; i++) {
        if(this.traits[i] === traitID) {
            return true;
        }
    }

    return false;
}

BattalionEntity.prototype.removeTrait = function(traitID) {
    for(let i = 0; i < this.traits.length; i++) {
        if(this.traits[i] === traitID) {
            this.traits[i] = this.traits[this.traits.length - 1];
            this.traits.pop();
            break;
        }
    }
}

BattalionEntity.prototype.loadTraits = function() {
    const traits = this.config.traits;

    if(traits) {
        for(let i = 0; i < traits.length; i++) {
            const traitID = TypeRegistry.TRAIT_TYPE[traits[i]];

            if(traitID !== undefined) {
                this.traits.push(traitID);
            }
        }
    }
}

BattalionEntity.prototype.destroy = function() {
    this.isMarkedForDestroy = true;
    this.sprite.destroy();
}

BattalionEntity.prototype.setTile = function(tileX, tileY) {
    this.tileX = tileX;
    this.tileY = tileY;
}

BattalionEntity.prototype.setPosition = function(positionVector) {
    const { x, y } = positionVector;

    this.sprite.setPosition(x, y);
}

BattalionEntity.prototype.setDirectionByName = function(name) {
    const direction = BattalionEntity.DIRECTION[name];

    if(direction !== undefined) {
        this.direction = direction;
    }
}

BattalionEntity.prototype.setDirection = function(direction) {
    if(Object.values(BattalionEntity.DIRECTION).includes(direction)) {
        this.direction = direction;
    }
}

BattalionEntity.prototype.setState = function(state) {
    if(Object.values(BattalionEntity.STATE).includes(state)) {
        this.state = state;
    }
}

BattalionEntity.prototype.getSpriteTypeID = function() {
    switch(this.state) {
        case BattalionEntity.STATE.IDLE: {
            switch(this.direction) {
                case BattalionEntity.DIRECTION.NORTH: return BattalionEntity.SPRITE_TYPE.IDLE_UP;
                case BattalionEntity.DIRECTION.EAST: return BattalionEntity.SPRITE_TYPE.IDLE_RIGHT;
                case BattalionEntity.DIRECTION.SOUTH: return BattalionEntity.SPRITE_TYPE.IDLE_DOWN;
                case BattalionEntity.DIRECTION.WEST: return BattalionEntity.SPRITE_TYPE.IDLE_LEFT;
            }
            break;
        }
        case BattalionEntity.STATE.MOVE: {
            switch(this.direction) {
                case BattalionEntity.DIRECTION.NORTH: return BattalionEntity.SPRITE_TYPE.IDLE_UP;
                case BattalionEntity.DIRECTION.EAST: return BattalionEntity.SPRITE_TYPE.IDLE_RIGHT;
                case BattalionEntity.DIRECTION.SOUTH: return BattalionEntity.SPRITE_TYPE.IDLE_DOWN;
                case BattalionEntity.DIRECTION.WEST: return BattalionEntity.SPRITE_TYPE.IDLE_LEFT;
            }
            break;
        }
        case BattalionEntity.STATE.FIRE: {
            switch(this.direction) {
                case BattalionEntity.DIRECTION.NORTH: return BattalionEntity.SPRITE_TYPE.FIRE_UP;
                case BattalionEntity.DIRECTION.EAST: return BattalionEntity.SPRITE_TYPE.FIRE_RIGHT;
                case BattalionEntity.DIRECTION.SOUTH: return BattalionEntity.SPRITE_TYPE.FIRE_DOWN;
                case BattalionEntity.DIRECTION.WEST: return BattalionEntity.SPRITE_TYPE.FIRE_LEFT;
            }
            break;
        }
    }

    return BattalionEntity.SPRITE_TYPE.IDLE_RIGHT;
}

BattalionEntity.prototype.getSpriteID = function() {
    const spriteTypeID = this.getSpriteTypeID();
    const spriteID = this.config.sprites[spriteTypeID];

    if(spriteID === undefined) {
        return null;
    }

    return spriteID;
}

BattalionEntity.prototype.updateSchema = function(gameContext, schemaID, schema) {
    this.sprite.updateSchema(gameContext, schemaID, schema);
}

BattalionEntity.prototype.updateSprite = function(gameContext) {
    const spriteID = this.getSpriteID();

    if(spriteID) {
        this.sprite.updateType(gameContext, spriteID);
    }
}

BattalionEntity.prototype.setTeam = function(teamID) {
    this.teamID = teamID;
}

BattalionEntity.prototype.onTurnStart = function(gameContext) {
    console.log("My turn started", this);
} 

BattalionEntity.prototype.onTurnEnd = function(gameContext) {
    console.log("My turn ended", this);
}

BattalionEntity.prototype.occupiesTile = function(tileX, tileY) {
    return isRectangleRectangleIntersect(tileX, tileY, 1, 1, this.tileX, this.tileY, this.config.dimX ?? 1, this.config.dimY ?? 1);
}

BattalionEntity.prototype.isColliding = function(target, range = 0) {
    return isRectangleRectangleIntersect(
        this.tileX - range,
        this.tileY - range,
        this.config.dimX - 1 + range * 2,
        this.config.dimY - 1 + range * 2,
        target.tileX,
        target.tileY,
        target.config.dimX - 1,
        target.config.dimY - 1
    );;
}

BattalionEntity.prototype.isSelectable = function() {
    return this.hp >= 0 && !this.isMarkedForDestroy;
}