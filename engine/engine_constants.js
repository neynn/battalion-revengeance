export const TILE_WIDTH = 56;
export const TILE_HEIGHT = 56;
export const MAX_TILES = 1000;

/**
 * 0x00 -> size
 * 
 * 0x01 -> x
 * 
 * 0x02 -> y
 * 
 * 0x03 -> w
 * 
 * 0x04 -> h
 * 
 * 0x05 -> offsetX
 * 
 * 0x06 -> offsetY
 */
export const TILE_FRAME_SIZE = 7;

export const TILE_MAX_FRAMES = 8;
export const TILE_WRITE_PTR_MAX = TILE_FRAME_SIZE * TILE_MAX_FRAMES - TILE_FRAME_SIZE;

export const TARGET_FPS = 60;
export const FIXED_DELTA_TIME = 1 / TARGET_FPS;
export const MAX_TICKS = 30;

export const MAX_TEXTURE_VARIANTS = 30;
export const DEFAULT_IMAGE_TYPE = ".png";

export const MAX_TILE_ROWS = 100;
export const MAX_TILE_COLUMNS = 100;
