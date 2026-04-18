import { MAX_TRAITS } from "../../constants.js";
import { mapMovementToCategory } from "../../enumHelpers.js";
import { ARMOR_TYPE, ATTACK_TYPE, DIRECTION, EFFECT_SPRITE, ENTITY_CATEGORY, ENTITY_SPRITE, JAMMER_FLAG, MINE_TYPE, MOVEMENT_TYPE, RANGE_TYPE, SHOP_TYPE, TRAIT_TYPE, WEAPON_TYPE } from "../../enums.js";

const TILE_STEP = 56;
const ENABLE_HYBRID = false;

const getRangeType = function(minRange, maxRange) {
    if(maxRange > 1) {
        if(minRange === 1 && ENABLE_HYBRID) {
            return RANGE_TYPE.HYBRID;
        }

        return RANGE_TYPE.RANGE;
    }

    if(minRange === 1) {
        return RANGE_TYPE.MELEE;
    }

    return RANGE_TYPE.NONE;
}

const effectNameToEnum = function(name) {
    switch(name) {
        case "death": return EFFECT_SPRITE.DEATH;
        case "fire": return EFFECT_SPRITE.FIRE;
        case "heal": return EFFECT_SPRITE.HEAL;
        default: return ENTITY_SPRITE._INVALID;
    }
}

const spriteNameToEnum = function(name) {
    switch(name) {
        case "idle_up": return ENTITY_SPRITE.IDLE_UP;
        case "idle_right": return ENTITY_SPRITE.IDLE_RIGHT;
        case "idle_down": return ENTITY_SPRITE.IDLE_DOWN;
        case "idle_left": return ENTITY_SPRITE.IDLE_LEFT;
        case "move_up": return ENTITY_SPRITE.MOVE_UP;
        case "move_right": return ENTITY_SPRITE.MOVE_RIGHT;
        case "move_down": return ENTITY_SPRITE.MOVE_DOWN;
        case "move_left": return ENTITY_SPRITE.MOVE_LEFT;
        case "fire_up": return ENTITY_SPRITE.FIRE_UP;
        case "fire_right": return ENTITY_SPRITE.FIRE_RIGHT;
        case "fire_down": return ENTITY_SPRITE.FIRE_DOWN;
        case "fire_left": return ENTITY_SPRITE.FIRE_LEFT;
        default: return ENTITY_SPRITE._INVALID
    }
}

export const EntityType = function(id) {
    this.id = id;
    this.dimX = 1;
    this.dimY = 1;
    this.name = "MISSING_NAME_ENTITY";
    this.desc = "MISSING_DESC_ENTITY";
    this.health = 1;
    this.damage = 0;
    this.weaponType = WEAPON_TYPE.NONE;
    this.movementType = MOVEMENT_TYPE.STATIONARY;
    this.armorType = ARMOR_TYPE.NONE;
    this.movementRange = 0;
    this.movementSpeed = 4 * TILE_STEP;
    this.jammerRange = 1;
    this.minRange = 1;
    this.maxRange = 1;
    this.streamRange = 1;
    this.cost = 0;
    this.sounds = {};
    this.effects = [];
    this.sprites = [];
    this.traits = [];
    this.category = mapMovementToCategory(this.movementType);
    this.rangeType = getRangeType(this.minRange, this.maxRange);
    this.shop = SHOP_TYPE.NONE;

    for(let i = 0; i < ENTITY_SPRITE._COUNT; i++) {
        this.sprites[i] = null;
    }

    for(let i = 0; i < EFFECT_SPRITE._COUNT; i++) {
        this.effects[i] = null;
    }

    this.effects[EFFECT_SPRITE.DEATH] = "explosion";
    this.effects[EFFECT_SPRITE.FIRE] = "small_attack";
    this.effects[EFFECT_SPRITE.HEAL] = "supply_attack";
}

EntityType.MIN_MOVE_COST = 1;
EntityType.MAX_MOVE_COST = 99;
EntityType.MIN_JAMMER_RANGE = 1;
EntityType.MAX_JAMMER_RANGE = 4;

EntityType.prototype.load = function(config, DEBUG_NAME) {
    const {
        dimX = 1,
        dimY = 1,
        health = 1,
        damage = 0,
        weaponType = "NONE",
        armorType = "NONE",
        movementRange = 0,
        movementType = "STATIONARY",
        movementSpeed = 4,
        jammerRange = 1,
        minRange = 1,
        maxRange = 1,
        streamRange = 1,
        cost = 0,
        shop = "NONE",
        desc = "MISSING_DESC_ENTITY",
        name = "MISSING_NAME_ENTITY",
        traits = [],
        sounds = {},
        sprites = {},
        effects = {}
    } = config;

    this.dimX = dimX;
    this.dimY = dimY;
    this.desc = desc;
    this.name = name;
    this.health = health;
    this.damage = damage;
    this.weaponType = WEAPON_TYPE[weaponType] ?? WEAPON_TYPE.NONE;
    this.movementType = MOVEMENT_TYPE[movementType] ?? MOVEMENT_TYPE.STATIONARY;
    this.armorType = ARMOR_TYPE[armorType] ?? ARMOR_TYPE.NONE;
    this.shop = SHOP_TYPE[shop] ?? SHOP_TYPE.NONE;
    this.movementRange = movementRange;
    this.movementSpeed = movementSpeed * TILE_STEP;
    this.jammerRange = jammerRange;
    this.streamRange = streamRange;
    this.cost = cost;
    this.minRange = minRange;
    this.maxRange = maxRange;
    this.sounds = sounds;

    if(this.maxRange < this.minRange) {
        this.maxRange = this.minRange;
    }

    if(this.jammerRange < EntityType.MIN_JAMMER_RANGE) {
        this.jammerRange = EntityType.MIN_JAMMER_RANGE;
    } else if(this.jammerRange > EntityType.MAX_JAMMER_RANGE) {
        this.jammerRange = EntityType.MAX_JAMMER_RANGE;
    }

    if(this.movementRange >= EntityType.MAX_MOVE_COST) {
        this.movementRange = EntityType.MAX_MOVE_COST;
    }

    this.category = mapMovementToCategory(this.movementType);
    this.rangeType = getRangeType(this.minRange, this.maxRange);

    for(const traitID of traits) {
        const index = TRAIT_TYPE[traitID];

        if(index !== undefined) {
            this.traits.push(index);
        }
    }

    if(this.traits.length > MAX_TRAITS) {
        this.traits.length = MAX_TRAITS;

        console.warn(`${DEBUG_NAME}: More than ${MAX_TRAITS} traits detected!`);
    }

    for(const spriteID in sprites) {
        const index = spriteNameToEnum(spriteID);

        if(index !== ENTITY_SPRITE._INVALID) {
            this.sprites[index] = sprites[spriteID];
        }
    }

    if(!this.sprites[ENTITY_SPRITE.MOVE_UP]) {
        this.sprites[ENTITY_SPRITE.MOVE_UP] = this.sprites[ENTITY_SPRITE.IDLE_UP];
    }

    if(!this.sprites[ENTITY_SPRITE.MOVE_RIGHT]) {
        this.sprites[ENTITY_SPRITE.MOVE_RIGHT] = this.sprites[ENTITY_SPRITE.IDLE_RIGHT];
    }

    if(!this.sprites[ENTITY_SPRITE.MOVE_DOWN]) {
        this.sprites[ENTITY_SPRITE.MOVE_DOWN] = this.sprites[ENTITY_SPRITE.IDLE_DOWN];
    }

    if(!this.sprites[ENTITY_SPRITE.MOVE_LEFT]) {
        this.sprites[ENTITY_SPRITE.MOVE_LEFT] = this.sprites[ENTITY_SPRITE.IDLE_LEFT];
    }

    for(const effectID in effects) {
        const index = effectNameToEnum(effectID);

        if(index !== EFFECT_SPRITE._INVALID) {
            this.effects[index] = effects[effectID];
        }
    }
}

EntityType.prototype.hasTrait = function(traitID) {
    for(let i = 0; i < this.traits.length; i++) {
        if(this.traits[i] === traitID) {
            return true;
        }
    }

    return false;
}

EntityType.prototype.getJammerFlags = function() {
    let flags = JAMMER_FLAG.NONE;

    //JAMMER also blocks airspace traffic.
    if(this.hasTrait(TRAIT_TYPE.JAMMER)) {
        flags |= JAMMER_FLAG.RADAR;
        flags |= JAMMER_FLAG.AIRSPACE_BLOCKED;
    }

    if(this.hasTrait(TRAIT_TYPE.SONAR)) {
        flags |= JAMMER_FLAG.SONAR;
    }

    return flags;
}

EntityType.prototype.getCloakFlag = function() {
    //The returned flags need to be unset in a jammer field, otherwise cloaking will not work.
    if(this.hasTrait(TRAIT_TYPE.STEALTH)) {
        if(this.hasTrait(TRAIT_TYPE.SUBMERGED)) {
            return JAMMER_FLAG.SONAR;
        }

        return JAMMER_FLAG.RADAR;
    }

    return JAMMER_FLAG.NONE;
}

EntityType.prototype.getAttackType = function() {
    if(this.hasTrait(TRAIT_TYPE.DISPERSION) || this.hasTrait(TRAIT_TYPE.JUDGEMENT)) {
        return ATTACK_TYPE.DISPERSION;
    }

    if(this.hasTrait(TRAIT_TYPE.STREAMBLAST)) {
        return ATTACK_TYPE.STREAMBLAST;
    }

    return ATTACK_TYPE.REGULAR;
}