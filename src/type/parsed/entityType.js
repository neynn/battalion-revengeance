import { ARMOR_TYPE, ENTITY_CATEGORY, MOVEMENT_TYPE, RANGE_TYPE, WEAPON_TYPE } from "../../enums.js";

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

const getCategory = function(movementType) {
    switch(movementType) {
        case MOVEMENT_TYPE.FLIGHT: return ENTITY_CATEGORY.AIR;
        case MOVEMENT_TYPE.RUDDER: return ENTITY_CATEGORY.SEA;
        case MOVEMENT_TYPE.HEAVY_RUDDER: return ENTITY_CATEGORY.SEA;
        default: return ENTITY_CATEGORY.LAND;
    }
}

export const EntityType = function(id, config) {
    const MAX_TRAITS = 4;
    const MIN_JAMMER_RANGE = 1;

    const {
        dimX = EntityType.DEFAULT.SIZE_X,
        dimY = EntityType.DEFAULT.SIZE_Y,
        health = EntityType.DEFAULT.HEALTH,
        damage = EntityType.DEFAULT.DAMAGE,
        weaponType = WEAPON_TYPE.NONE,
        armorType = ARMOR_TYPE.NONE,
        movementRange = EntityType.DEFAULT.MOVEMENT_RANGE,
        movementType = MOVEMENT_TYPE.STATIONARY,
        movementSpeed = EntityType.DEFAULT.MOVEMENT_SPEED,
        jammerRange = EntityType.DEFAULT.JAMMER_RANGE,
        minRange = EntityType.DEFAULT.MIN_RANGE,
        maxRange = EntityType.DEFAULT.MAX_RANGE,
        streamRange = EntityType.DEFAULT.STREAM_RANGE,
        cost = 0,
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
    this.category = getCategory(movementType);
    this.rangeType = getRangeType(minRange, maxRange);

    if(this.maxRange < this.minRange) {
        this.maxRange = this.minRange;
    }

    if(this.jammerRange < MIN_JAMMER_RANGE) {
        this.jammerRange = MIN_JAMMER_RANGE;
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

EntityType.DEFAULT = {
    MOVEMENT_SPEED: 224,
    SIZE_X: 1,
    SIZE_Y: 1,
    MIN_RANGE: 1,
    MAX_RANGE: 1,
    DAMAGE: 0,
    MOVEMENT_RANGE: 0,
    STREAM_RANGE: 1,
    JAMMER_RANGE: 1,
    HEALTH: 1
};