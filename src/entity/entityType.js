import { TypeRegistry } from "../type/typeRegistry.js";

export const EntityType = function(id, config) {
    const {
        dimX = EntityType.DEFAULT.SIZE_X,
        dimY = EntityType.DEFAULT.SIZE_Y,
        health = EntityType.DEFAULT.HEALTH,
        damage = EntityType.DEFAULT.DAMAGE,
        weaponType = EntityType.DEFAULT.WEAPON_TYPE,
        armorType = EntityType.DEFAULT.ARMOR_TYPE,
        movementRange = EntityType.DEFAULT.MOVEMENT_RANGE,
        movementType = EntityType.DEFAULT.MOVEMENT_TYPE,
        movementSpeed = EntityType.DEFAULT.MOVEMENT_SPEED,
        jammerRange = EntityType.DEFAULT.JAMMER_RANGE,
        minRange = EntityType.DEFAULT.MIN_RANGE,
        maxRange = EntityType.DEFAULT.MAX_RANGE,
        streamRange = EntityType.DEFAULT.STREAM_RANGE,
        desc = "MISSING_ENTITY_DESC",
        name = "MISSING_ENTITY_NAME",
        traits = [],
        sounds = {},
        sprites = {}
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
    this.sounds = sounds;
    this.sprites = sprites;
    this.traits = [];

    if(this.maxRange < this.minRange) {
        this.maxRange = this.minRange;
    }

    if(EntityType.HYBRID_ENABLED) {
        if(this.maxRange > 1 && this.minRange === 1) {
            this.minRange = 2;
        }
    }

    for(let i = 0; i < traits.length && i < EntityType.MAX_TRAITS; i++) {
        const traitID = traits[i];

        if(TypeRegistry.TRAIT_TYPE[traitID] !== undefined) {
            this.traits.push(TypeRegistry.TRAIT_TYPE[traitID]);
        } else {
            console.error("UNKNOWN TRAIT!", traitID);
        }
    }
}

EntityType.HYBRID_ENABLED = false;
EntityType.MAX_TRAITS = 4;

EntityType.DEFAULT = {
    MOVEMENT_SPEED: 224,
    SIZE_X: 1,
    SIZE_Y: 1,
    MIN_RANGE: 1,
    MAX_RANGE: 1,
    DAMAGE: 0,
    MOVEMENT_RANGE: 0,
    STREAM_RANGE: 1,
    JAMMER_RANGE: 0,
    HEALTH: 1,
    MOVEMENT_TYPE: TypeRegistry.MOVEMENT_TYPE.STATIONARY,
    WEAPON_TYPE: TypeRegistry.WEAPON_TYPE.NONE,
    ARMOR_TYPE: TypeRegistry.ARMOR_TYPE.NONE
}