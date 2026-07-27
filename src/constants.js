import { TEAM_STAT } from "./enums.js";

export const VICTORY_BONUS = 5000;
export const SCORE_BONUS = {
    [TEAM_STAT.UNITS_BUILT]: 500,
    [TEAM_STAT.UNITS_KILLED]: 1000,
    [TEAM_STAT.UNITS_LOST]: -100,
    [TEAM_STAT.STRUCTURES_CAPTURED]: 2500,
    [TEAM_STAT.STRUCTURES_LOST]: -1000,
    [TEAM_STAT.RESOURCES_COLLECTED]: 1
};

//TODO(neyn): Implement
export const MAX_TEAMS = 8;
export const MAX_UNITS = 1000;
export const MAX_BUILDINGS = 100;

export const BUILDING_MAX_TRAITS = 4;

export const UNIT_MAX_TRAITS = 4;
export const UNIT_MAX_ACTIONS_PER_TURN = 1;
export const UNIT_MAX_MOVES_PER_TURN = 1;
export const UNIT_MAX_MORALE_DELTA = 3;
export const UNIT_MIN_MORALE_DELTA = -3;
export const UNIT_DEATH_FADE_RATE = 1;
export const UNIT_CLOAK_FADE_RATE = 2.5;
export const UNIT_UNCLOAK_FADE_RATE = 2.5;