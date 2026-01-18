import { TEAM_STAT } from "./enums.js";

export const TILE_WIDTH = 56;

export const TILE_HEIGHT = 56;

export const FADE_RATE = 3;

export const DEATH_FADE_RATE = 1.5;

export const SCORE_BONUS = {
    [TEAM_STAT.UNITS_BUILT]: 500,
    [TEAM_STAT.UNITS_KILLED]: 1000,
    [TEAM_STAT.UNITS_LOST]: -100,
    [TEAM_STAT.STRUCTURES_CAPTURED]: 2500,
    [TEAM_STAT.STRUCTURES_LOST]: -1000,
    [TEAM_STAT.RESOURCES_COLLECTED]: 1
};

export const VICTORY_BONUS = 5000;