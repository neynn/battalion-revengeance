export const PLAYER_PREFERENCE = {
    FORCE_HEALTH_DRAW: 1,
    DISABLE_IDLE_ANIMATIONS: 0 //TODO: Implement!
};

export const TRAIT_CONFIG = {
    SHRAPNEL_RANGE: 1,
    ABSORBER_RATE: 0.2,
    OVERHEAT_DAMAGE: 0.1,
    HEROIC_THRESHOLD: 1,
    JUDGEMENT_RANGE: 2,
    DISPERSION_RANGE: 1,
    STEER_REDUCTION: 0.1,
    STEER_MAX_REDUCTION: 0.5,
    BLITZ_MULTIPLIER: 1.2,
    SCHWERPUNKT_MULTIPLIER: 1.4,
    STEALTH_MULTIPLIER: 2
};

export const AUTOTILER_TYPE = {
    PATH: "battalion_path"
};

export const LAYER_TYPE = {
    BUILDING: 0,
    SEA: 1,
    LAND: 2,
    GFX: 3,
    COUNT: 4
};

export const TILE_ID = {
    NONE: 0,
    GRASS: 1,
    BOREAL: 2,
    ARCTIC: 3,
    ROAD_0: 4,
    ROAD_1: 5,
    ROAD_2: 6,
    ROAD_3: 7,
    ROAD_4: 8,
    ROAD_5: 9,
    ROAD_6: 10,
    ROAD_7: 11,
    ROAD_8: 12,
    ROAD_9: 13,
    ROAD_10: 14,
    ROAD_11: 15,
    ROAD_12: 16,
    ROAD_13: 17,
    ROAD_14: 18,
    ROAD_15: 19,
    VOLANO: 20,
    //21-68: RIVER
    SHORE_0: 69,
    SHORE_1: 70,
    SHORE_2: 71,
    SHORE_3: 72,
    SHORE_4: 73,
    SHORE_5: 74,
    SHORE_6: 75,
    SHORE_7: 76,
    SHORE_8: 77,
    SHORE_9: 78,
    SHORE_10: 79,
    SHORE_11: 80,
    ISLAND_1: 81,
    ISLAND_2: 82,
    ISLAND_3: 83,
    ISLAND_4: 84,
    SWIRL_1: 85,
    SWIRL_2: 86,
    SWIRL_3: 87,
    SWIRL_4: 88,
    ROCKS_1: 89,
    ROCKS_2: 90,
    ROCKS_3: 91,
    ROCKS_4: 92,
    OVERLAY_MOVE: 93,
    OVERLAY_MOVE_ATTACK: 94,
    OVERLAY_ATTACK_LIGHT: 95,
    OVERLAY_ATTACK: 96,

    PATH_UP: 101,
    PATH_RIGHT: 102,
    PATH_DOWN: 103,
    PATH_LEFT: 104,
    PATH_CENTER: 105,

    JAMMER: 113
};

export const DIRECTION = {
    NORTH: 1 << 0,
    EAST: 1 << 1,
    SOUTH: 1 << 2,
    WEST: 1 << 3
};

export const RANGE_TYPE = {
    NONE: 0,
    MELEE: 1,
    RANGE: 2,
    HYBRID: 3
};

export const ATTACK_FLAG = {
    NONE: 0,
    COUNTER: 1 << 0,
    SHRAPNEL: 1 << 1,
    AREA: 1 << 2,
    LINE: 1 << 3
};

export const PATH_FLAG = {
    NONE: 0,
    UNREACHABLE: 1 << 0,
    START: 1 << 1
};

export const PATH_INTERCEPT = {
    NONE: 0,
    VALID: 1,
    ILLEGAL: 2
};

export const ATTACK_TYPE = {
    REGULAR: 0,
    STREAMBLAST: 1,
    DISPERSION: 2
};

export const TRANSPORT_TYPE = {
    BARGE: 0,
    PELICAN: 1,
    STORK: 2
};
