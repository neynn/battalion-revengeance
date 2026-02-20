import { mapMovementToCategory } from "../../enumHelpers.js";
import { ARMOR_TYPE, ATTACK_TYPE, JAMMER_FLAG, MOVEMENT_TYPE, RANGE_TYPE, SHOP_TYPE, TRAIT_TYPE, WEAPON_TYPE } from "../../enums.js";

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

export const EntityType = function(id, config) {
    const MAX_TRAITS = 4;


    const {
        dimX = 1,
        dimY = 1,
        health = 1,
        damage = 0,
        weaponType = WEAPON_TYPE.NONE,
        armorType = "NONE",
        movementRange = 0,
        movementType = "STATIONARY",
        movementSpeed = 224,
        jammerRange = 1,
        minRange = 1,
        maxRange = 1,
        streamRange = 1,
        cost = 0,
        shop = SHOP_TYPE.NONE,
        desc = "MISSING_DESC_ENTITY",
        name = "MISSING_NAME_ENTITY",
        traits = [],
        sounds = {},
        sprites = {},
        effects = {}
    } = config;

    this.movementType = MOVEMENT_TYPE[movementType] ?? MOVEMENT_TYPE.STATIONARY;
    this.armorType = ARMOR_TYPE[armorType] ?? ARMOR_TYPE.NONE;

    this.id = id;
    this.dimX = dimX;
    this.dimY = dimY;
    this.desc = desc;
    this.name = name;
    this.health = health;
    this.damage = damage;
    this.weaponType = weaponType;
    this.movementRange = movementRange;
    this.movementSpeed = movementSpeed;
    this.jammerRange = jammerRange;
    this.minRange = minRange;
    this.maxRange = maxRange;
    this.streamRange = streamRange;
    this.cost = cost;
    this.sounds = sounds;
    this.sprites = sprites;
    this.effects = effects;
    this.traits = traits;
    this.category = mapMovementToCategory(this.movementType);
    this.rangeType = getRangeType(minRange, maxRange);
    this.shop = shop;

    if(this.maxRange < this.minRange) {
        this.maxRange = this.minRange;
    }

    if(this.jammerRange < EntityType.MIN_JAMMER_RANGE) {
        this.jammerRange = EntityType.MIN_JAMMER_RANGE;
    } else if(this.jammerRange > EntityType.MAX_JAMMER_RANGE) {
        this.jammerRange = EntityType.MAX_JAMMER_RANGE;
    }

    if(this.traits.length > MAX_TRAITS) {
        this.traits.length = MAX_TRAITS;

        console.warn(`${this.id}: More than ${MAX_TRAITS} traits detected!`);
    }

    if(this.movementRange >= EntityType.MAX_MOVE_COST) {
        this.movementRange = EntityType.MAX_MOVE_COST;
    }

    if(this.sprites["move_right"] === undefined) {
        this.sprites["move_right"] = this.sprites["idle_right"];
    }

    if(this.sprites["move_left"] === undefined) {
        this.sprites["move_left"] = this.sprites["idle_left"];
    }

    if(this.sprites["move_up"] === undefined) {
        this.sprites["move_up"] = this.sprites["idle_up"];
    }

    if(this.sprites["move_down"] === undefined) {
        this.sprites["move_down"] = this.sprites["idle_down"];
    }
}

EntityType.MIN_MOVE_COST = 1;
EntityType.MAX_MOVE_COST = 99;
EntityType.MIN_JAMMER_RANGE = 1;
EntityType.MAX_JAMMER_RANGE = 4;

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