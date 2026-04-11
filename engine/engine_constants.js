export const TILE_WIDTH = 56;
export const TILE_HEIGHT = 56;

export const TILE_FRAME_SIZE = 7;
export const TILE_MAX_FRAMES = 8;
export const TILE_WRITE_PTR_MAX = TILE_FRAME_SIZE * TILE_MAX_FRAMES - TILE_FRAME_SIZE;

export const TARGET_FPS = 60;
export const FIXED_DELTA_TIME = 1 / TARGET_FPS;
export const MAX_TICKS = 30;