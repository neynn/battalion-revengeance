import { CLIMATE_TYPE, MINE_TYPE, MOVEMENT_TYPE, TERRAIN_TYPE } from "../../enums.js";

export const TileType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_TILE";
    this.desc = "MISSING_DESC_TILE";
    this.climate = CLIMATE_TYPE.NONE;
    this.terrain = [];
    this.allowedMines = [];
    this.passability = [];

    for(let i = 0; i < MOVEMENT_TYPE._COUNT; i++) {
        this.passability[i] = -1;
    }
}

TileType.prototype.load = function(config, DEBUG_NAME) {
    const MAX_TERRAIN = 4;

    const {
        name = "MISSING_NAME_TILE",
        desc = "MISSING_DESC_TILE",
        climate = "NONE",
        terrain = [],
        passability = {},
        allowedMines = []
    } = config;

    this.name = name;
    this.desc = desc;
    this.climate = CLIMATE_TYPE[climate] ?? CLIMATE_TYPE.NONE;

    if(passability['*'] !== undefined) {
        const defaultPassability = passability['*'];

        for(let i = 0; i < MOVEMENT_TYPE._COUNT; i++) {
            this.passability[i] = defaultPassability;
        }
    }

    for(const typeID in passability) {
        const index = MOVEMENT_TYPE[typeID];

        if(index !== undefined) {
            this.passability[index] = passability[typeID];
        }
    }

    for(const mineType of allowedMines) {
        const mineID = MINE_TYPE[mineType];

        if(mineID !== undefined) {
            this.allowedMines.push(mineID);
        } else {
            console.warn(`${DEBUG_NAME}: Unknown mine type! [mineType:${mineType}]`);
        }
    }

    for(const terrainID of terrain) {
        const index = TERRAIN_TYPE[terrainID];

        if(index !== undefined) {
            this.terrain.push(index);
        } else {
            console.warn(`${DEBUG_NAME}: Terrain ${terrainID} does not exist!`);
        }
    }

    if(this.terrain.length > MAX_TERRAIN) {
        this.terrain.length = MAX_TERRAIN;

        console.warn(`${DEBUG_NAME}: More than ${MAX_TERRAIN} terrains detected!`);
    }
}

TileType.prototype.allowsMine = function(mineType) {
    for(let i = 0; i < this.allowedMines.length; i++) {
        if(this.allowedMines[i] === mineType) {
            return true;
        }
    }

    return false;
}

TileType.prototype.getPassabilityCost = function(movementType) {
    if(movementType < 0 || movementType >= MOVEMENT_TYPE._COUNT) {
        return -1;
    }

    return this.passability[movementType];
}