export const CLIENT_EVENT = {
    INSTANCE_TEAM: 0,
    INSTANCE_ENTITY_BATCH: 1,
    INSTANCE_MAP: 2,
    INSTANCE_MAP_FROM_DATA: 3,
    INSTANCE_ACTOR: 4,
    INSTANCE_GAME: 6,
    EVENT: 5
};

export const EVENT_TYPE = {
    CLIENT: "Client",
    COUNTER: "Counter",
    CONTROL: "Control",
    RESOURCES_CONSUME: "ResourcesConsume",
    ITEMS_CONSUME: "ItemsConsume",
    ITEMS_OWN: "ItemsOwn",
    MILESTONE: "Milestone"
};

export const ACTION_TYPE = {
    MOVE: "Move",
    ATTACK: "Attack",
    CONSTRUCTION: "Construction",
    COUNTER_ATTACK: "CounterAttack",
    COUNTER_MOVE: "CounterMove",
    DEATH: "Death",
    FIRE_MISSION: "FireMission",
    CLEAR_DEBRIS: "ClearDebris",
    HEAL: "Heal",
    COLLECT: "Collect"
};

export const ACTOR_ID = {
    STORY_PLAYER: "PLAYER",
    STORY_ENEMY: "ENEMY"
};

export const TEAM_NAME = {
    ALLIES: "Allies",
    CRIMSON: "Crimson",
    NEUTRAL: "Neutral",
    VERSUS: "Versus"
};

export const TEAM_TYPE = {
    CRIMSON: 0,
    ALLIES: 1,
    NEUTRAL: 2,
    VERSUS: 3
};

export const TILE_NAME = {
    GROUND: "Ground",
    MOUNTAIN: "Mountain",
    SEA: "Sea",
    SHORE: "Shore"
};

export const TILE_TYPE = {
    GROUND: 0,
    MOUNTAIN: 1,
    SEA: 2,
    SHORE: 3
};

export const ALLIANCE_TYPE = {
    ENEMY: "Enemy",
    ALLY: "Ally",
    NEUTRAL: "Neutral"
};

export const OBJECTIVE_TYPE = {
    DESTROY: "Destroy",
    CONQUER: "Conquer",
    COLLECT: "Collect"
};

export const UI_SONUD = {
    HEAL: "sound_unit_repair",
    BUTTON: "sound_button_press"
};

export const DEBRIS_TYPE = {
    DEBRIS: 0,
    SCORCHED_GROUND: 1
};

export const getTeamName = function(id) {
    switch(id) {
        case TEAM_TYPE.CRIMSON: return TEAM_NAME.CRIMSON;
        case TEAM_TYPE.ALLIES: return TEAM_NAME.ALLIES;
        case TEAM_TYPE.NEUTRAL: return TEAM_NAME.NEUTRAL;
        case TEAM_TYPE.VERSUS: return TEAM_NAME.VERSUS;
        default: return TEAM_NAME.NEUTRAL;
    }
}

export const getTeamID = function(name) {
    switch(name) {
        case TEAM_NAME.CRIMSON: return TEAM_TYPE.CRIMSON;
        case TEAM_NAME.ALLIES: return TEAM_TYPE.ALLIES;
        case TEAM_NAME.NEUTRAL: return TEAM_TYPE.NEUTRAL;
        case TEAM_NAME.VERSUS: return TEAM_TYPE.VERSUS;
        default: return TEAM_TYPE.NEUTRAL;
    }
}

export const getTileID = function(name) {
    switch(name) {
        case TILE_NAME.GROUND: return TILE_TYPE.GROUND;
        case TILE_NAME.MOUNTAIN: return TILE_TYPE.MOUNTAIN;
        case TILE_NAME.SEA: return TILE_TYPE.SEA;
        case TILE_NAME.SHORE: return TILE_TYPE.SHORE;
        default: return TILE_TYPE.GROUND;
    }
}