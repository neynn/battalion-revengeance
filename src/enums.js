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
    NONE: 0b00000000,
    COUNTER: 1 << 0,
    SHRAPNEL: 1 << 1,
    AREA: 1 << 2,
    LINE: 1 << 3
};

export const PATH_FLAG = {
    NONE: 0b00000000,
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
