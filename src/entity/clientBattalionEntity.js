import { playGFX } from "../systems/animation.js";
import { BattalionEntity } from "./battalionEntity.js";
import { ATTACK_TYPE, DIRECTION } from "../enums.js";

export const ClientBattalionEntity = function(id, view) {
    BattalionEntity.call(this, id);

    this.view = view;
}

ClientBattalionEntity.EFFECT_TYPE = {
    DEATH: "death",
    ATTACK: "attack",
    HEAL: "heal"
};

ClientBattalionEntity.DEFAULT_EFFECTS = {
    [ClientBattalionEntity.EFFECT_TYPE.DEATH]: "explosion",
    [ClientBattalionEntity.EFFECT_TYPE.HEAL]: null, //TODO: Implement
    [ClientBattalionEntity.EFFECT_TYPE.ATTACK]: "small_attack"
};

ClientBattalionEntity.DEFAULT_ATTACK_EFFECTS = {
    [ATTACK_TYPE.REGULAR]: "small_attack",
    [ATTACK_TYPE.DISPERSION]: "gas_attack",
    [ATTACK_TYPE.STREAMBLAST]: "small_attack" //TODO: Implement
};

ClientBattalionEntity.SPRITE_TYPE = {
    IDLE_RIGHT: "idle_right",
    IDLE_LEFT: "idle_left",
    IDLE_DOWN: "idle_down",
    IDLE_UP: "idle_up",
    FIRE_RIGHT: "fire_right",
    FIRE_LEFT: "fire_left",
    FIRE_DOWN: "fire_down",
    FIRE_UP: "fire_up"
};

ClientBattalionEntity.SOUND_TYPE = {
    HEAL: "heal",
    MOVE: "move",
    FIRE: "fire",
    CLOAK: "cloak",
    DEATH: "death",
    RECRUIT: "recruit",
    UNCLOAK: "uncloak"
};

ClientBattalionEntity.DEFAULT_SOUNDS = {
    [ClientBattalionEntity.SOUND_TYPE.HEAL]: null, //TODO: Implement
    [ClientBattalionEntity.SOUND_TYPE.CLOAK]: "cloak",
    [ClientBattalionEntity.SOUND_TYPE.DEATH]: "explosion",
    [ClientBattalionEntity.SOUND_TYPE.UNCLOAK]: "uncloak",
};

ClientBattalionEntity.prototype = Object.create(BattalionEntity.prototype);
ClientBattalionEntity.prototype.constructor = ClientBattalionEntity;

ClientBattalionEntity.prototype.onHealthUpdate = function() {
    this.view.onHealthUpdate(this.health, this.maxHealth);
}

ClientBattalionEntity.prototype.onLoad = function(gameContext, data) {
    this.setCustomInfo(data.name, data.desc);

    if(this.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
        this.setOpacity(0);
    }

    this.updateSprite(gameContext);
}

ClientBattalionEntity.prototype.onSave = function(data) {
    data["name"] = this.customName;
    data["desc"] = this.customDesc;
}

ClientBattalionEntity.prototype.getDescription = function(gameContext) {
    const { language } = gameContext;
    
    if(this.customDesc) {
        return language.getMapTranslation(this.customDesc);
    }

    return language.getSystemTranslation(this.config.desc);
}

ClientBattalionEntity.prototype.getName = function(gameContext) {
    const { language } = gameContext;
    
    if(this.customName) {
        return language.getMapTranslation(this.customName);
    }

    return language.getSystemTranslation(this.config.name);
}

ClientBattalionEntity.prototype.playIdle = function(gameContext) {
    this.state = BattalionEntity.STATE.IDLE;
    this.updateSprite(gameContext);
    this.view.unlockEnd();
}

ClientBattalionEntity.prototype.playCloak = function(gameContext) {
    this.playSound(gameContext, ClientBattalionEntity.SOUND_TYPE.CLOAK);
}

ClientBattalionEntity.prototype.playUncloak = function(gameContext) {}

ClientBattalionEntity.prototype.playMove = function(gameContext) {
    this.state = BattalionEntity.STATE.MOVE;
    this.updateSprite(gameContext);
    this.playSound(gameContext, ClientBattalionEntity.SOUND_TYPE.MOVE);
}

ClientBattalionEntity.prototype.playDeath = function(gameContext) {
    const spriteType = this.getDeathEffect();

    this.state = BattalionEntity.STATE.DEAD;
    this.playSound(gameContext, ClientBattalionEntity.SOUND_TYPE.DEATH);

    playGFX(gameContext, spriteType, this.tileX, this.tileY);
}

ClientBattalionEntity.prototype.playAttack = function(gameContext) {
    this.state = BattalionEntity.STATE.FIRE;
    this.playSound(gameContext, ClientBattalionEntity.SOUND_TYPE.FIRE);
    this.updateSprite(gameContext);
    this.view.lockEnd();
}

ClientBattalionEntity.prototype.playHeal = function(gameContext) {
    this.state = BattalionEntity.STATE.FIRE;
    this.playSound(gameContext, ClientBattalionEntity.SOUND_TYPE.HEAL);
    this.updateSprite(gameContext);
    this.view.lockEnd();
}

ClientBattalionEntity.prototype.playCounter = function(gameContext, target) {
    this.playAttack(gameContext, target);
}

ClientBattalionEntity.prototype.destroy = function() {
    this.isMarkedForDestroy = true;
    this.view.destroy();
}

ClientBattalionEntity.prototype.updatePosition = function(deltaX, deltaY) {
    this.view.updatePosition(deltaX, deltaY);
}

ClientBattalionEntity.prototype.setPosition = function(positionX, positionY) {
    this.view.setPosition(positionX, positionY);
}

ClientBattalionEntity.prototype.setPositionVec = function(positionVector) {
    const { x, y } = positionVector;

    this.view.setPosition(x, y);
}

ClientBattalionEntity.prototype.setOpacity = function(opacity) {
    this.view.setOpacity(opacity);
}

ClientBattalionEntity.prototype.getAnimationDuration = function() {
    return this.view.visual.getTotalFrameTime();
}

ClientBattalionEntity.prototype.updateSprite = function(gameContext) {
    const spriteType = this.getSpriteType();
    const spriteID = this.config.sprites[spriteType];

    if(spriteID) {
        this.view.updateType(gameContext, spriteID);
    }
}

ClientBattalionEntity.prototype.updateSchema = function(gameContext, schemaID, schema) {
    this.view.updateSchema(gameContext, schemaID, schema);
}

ClientBattalionEntity.prototype.bufferSounds = function(gameContext) {
    const { client } = gameContext;
    const { soundPlayer } = client;

    for(const soundName in this.config.sounds) {
        const sound = this.config.sounds[soundName];

        if(Array.isArray(sound)) {
            for(const soundID of sound) {
                soundPlayer.bufferAudio(soundID);
            }
        } else {
            soundPlayer.bufferAudio(sound);
        }
    }
}

ClientBattalionEntity.prototype.bufferSprites = function(gameContext) {
    const spriteNames = Object.values(ClientBattalionEntity.SPRITE_TYPE);

    for(const spriteName of spriteNames) {
        const spriteID = this.config.sprites[spriteName];

        if(spriteID) {
            this.view.preload(gameContext, spriteID);
        }
    }
}

ClientBattalionEntity.prototype.getSpriteType = function() {
    switch(this.state) {
        case BattalionEntity.STATE.IDLE: {
            switch(this.direction) {
                case DIRECTION.NORTH: return ClientBattalionEntity.SPRITE_TYPE.IDLE_UP;
                case DIRECTION.EAST: return ClientBattalionEntity.SPRITE_TYPE.IDLE_RIGHT;
                case DIRECTION.SOUTH: return ClientBattalionEntity.SPRITE_TYPE.IDLE_DOWN;
                case DIRECTION.WEST: return ClientBattalionEntity.SPRITE_TYPE.IDLE_LEFT;
            }
            break;
        }
        case BattalionEntity.STATE.MOVE: {
            switch(this.direction) {
                case DIRECTION.NORTH: return ClientBattalionEntity.SPRITE_TYPE.IDLE_UP;
                case DIRECTION.EAST: return ClientBattalionEntity.SPRITE_TYPE.IDLE_RIGHT;
                case DIRECTION.SOUTH: return ClientBattalionEntity.SPRITE_TYPE.IDLE_DOWN;
                case DIRECTION.WEST: return ClientBattalionEntity.SPRITE_TYPE.IDLE_LEFT;
            }
            break;
        }
        case BattalionEntity.STATE.FIRE: {
            switch(this.direction) {
                case DIRECTION.NORTH: return ClientBattalionEntity.SPRITE_TYPE.FIRE_UP;
                case DIRECTION.EAST: return ClientBattalionEntity.SPRITE_TYPE.FIRE_RIGHT;
                case DIRECTION.SOUTH: return ClientBattalionEntity.SPRITE_TYPE.FIRE_DOWN;
                case DIRECTION.WEST: return ClientBattalionEntity.SPRITE_TYPE.FIRE_LEFT;
            }
            break;
        }
    }

    return ClientBattalionEntity.SPRITE_TYPE.IDLE_RIGHT;
}

ClientBattalionEntity.prototype.getHealEffect = function() {
    let sprite = this.config.effects[ClientBattalionEntity.EFFECT_TYPE.HEAL];

    if(!sprite) {
        sprite = ClientBattalionEntity.DEFAULT_EFFECTS[ClientBattalionEntity.EFFECT_TYPE.HEAL];
    }

    return sprite;
}

ClientBattalionEntity.prototype.getDeathEffect = function() {
    let sprite = this.config.effects[ClientBattalionEntity.EFFECT_TYPE.DEATH];

    if(!sprite) {
        sprite = ClientBattalionEntity.DEFAULT_EFFECTS[ClientBattalionEntity.EFFECT_TYPE.DEATH];
    }

    return sprite;
}

ClientBattalionEntity.prototype.getAttackEffect = function() {
    let sprite = this.config.effects[ClientBattalionEntity.EFFECT_TYPE.ATTACK];

    if(!sprite) {
        const attackType = this.getAttackType();

        sprite = ClientBattalionEntity.DEFAULT_ATTACK_EFFECTS[attackType];

        if(!sprite) {
            sprite = ClientBattalionEntity.DEFAULT_EFFECTS[ClientBattalionEntity.EFFECT_TYPE.ATTACK];
        }
    }

    return sprite;
}

ClientBattalionEntity.prototype.playSound = function(gameContext, soundType) {
    const { client } = gameContext;
    const { soundPlayer } = client;
    let soundID = this.config.sounds[soundType];

    if(!soundID) {
        soundID = ClientBattalionEntity.DEFAULT_SOUNDS[soundType];
    }

    if(soundID) {
        soundPlayer.play(soundID);
    }
}