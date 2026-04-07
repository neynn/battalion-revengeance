export const COMPLETION_STATE = {
    NOT_COMPLETED: 0,
    COMPLETED: 1
};

export const VICTORY_FLAG = {
    NONE: 0,
    MISSION_FIRST: 1 << 0,
    CHAPTER_FIRST: 1 << 1,
    CAMPAIGN_FIRST: 1 << 2,
    SCENARIO_FIRST: 1 << 3
};

export const MAX_MISSIONS = 5;
export const MAX_CHAPTERS = 7;