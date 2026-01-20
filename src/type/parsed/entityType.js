import { mapMovementToCategory } from "../../enumHelpers.js";
import { ARMOR_TYPE, ATTACK_TYPE, MOVEMENT_TYPE, RANGE_TYPE, SHOP_TYPE, TRAIT_TYPE, WEAPON_TYPE } from "../../enums.js";
import { JammerField } from "../../map/jammerField.js";

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
    const MIN_JAMMER_RANGE = 1;
    const MAX_JAMMER_RANGE = 4;

    const {
        dimX = 1,
        dimY = 1,
        health = 1,
        damage = 0,
        weaponType = WEAPON_TYPE.NONE,
        armorType = ARMOR_TYPE.NONE,
        movementRange = 0,
        movementType = MOVEMENT_TYPE.STATIONARY,
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

    this.id = id;
    this.dimX = dimX;
    this.dimY = dimY;
    this.desc = desc;
    this.name = name;
    this.health = health;
    this.damage = damage;
    this.weaponType = weaponType;
    this.armorType = armorType;
    this.movementRange = movementRange;
    this.movementType = movementType;
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
    this.category = mapMovementToCategory(movementType);
    this.rangeType = getRangeType(minRange, maxRange);
    this.shop = shop;

    if(this.maxRange < this.minRange) {
        this.maxRange = this.minRange;
    }

    if(this.jammerRange < MIN_JAMMER_RANGE) {
        this.jammerRange = MIN_JAMMER_RANGE;
    } else if(this.jammerRange > MAX_JAMMER_RANGE) {
        this.jammerRange = MAX_JAMMER_RANGE;
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

EntityType.prototype.hasTrait = function(traitID) {
    for(let i = 0; i < this.traits.length; i++) {
        if(this.traits[i] === traitID) {
            return true;
        }
    }

    return false;
}

EntityType.prototype.getJammerFlags = function() {
    let flags = JammerField.FLAG.NONE;

    //JAMMER also blocks airspace traffic.
    if(this.hasTrait(TRAIT_TYPE.JAMMER)) {
        flags |= JammerField.FLAG.RADAR;
        flags |= JammerField.FLAG.AIRSPACE_BLOCKED;
    }

    if(this.hasTrait(TRAIT_TYPE.SONAR)) {
        flags |= JammerField.FLAG.SONAR;
    }

    return flags;
}

EntityType.prototype.getCloakFlag = function() {
    //The returned flags need to be unset in a jammer field, otherwise cloaking will not work.
    if(this.hasTrait(TRAIT_TYPE.STEALTH)) {
        if(this.hasTrait(TRAIT_TYPE.SUBMERGED)) {
            return JammerField.FLAG.SONAR;
        }

        return JammerField.FLAG.RADAR;
    }

    return JammerField.FLAG.NONE;
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