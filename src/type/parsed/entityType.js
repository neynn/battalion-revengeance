export const EntityType = function(id, config) {
    const MAX_TRAITS = 4;
    const MIN_JAMMER_RANGE = 1;

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
        desc = EntityType.MISSING.DESC,
        name = EntityType.MISSING.NAME,
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
    this.traits = traits;

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
}

EntityType.MISSING = {
    NAME: "MISSING_NAME_ENTITY",
    DESC: "MISSING_DESC_ENTITY"
};

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
    HEALTH: 1,
    MOVEMENT_TYPE: "STATIONARY",
    WEAPON_TYPE: "NONE",
    ARMOR_TYPE: "NONE"
};