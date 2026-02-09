import { CLIMATE_TYPE, MINE_TYPE } from "../../enums.js";

export const TileType = function(id, config) {
    const MAX_TERRAIN = 4;

    const {
        name = "MISSING_NAME_TILE",
        desc = "MISSING_DESC_TILE",
        climate = CLIMATE_TYPE.NONE,
        terrain = [],
        passability = {},
        allowedMines = []
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.climate = climate;
    this.terrain = terrain;
    this.passability = passability;
    this.allowedMines = [];

    for(const mineType of allowedMines) {
        const mineID = MINE_TYPE[mineType];

        if(mineID !== undefined) {
            this.allowedMines.push(mineID);
        } else {
            console.warn(`${this.id}: Unknown mine type! [mineType:${mineType}]`);
        }
    }

    if(this.terrain.length > MAX_TERRAIN) {
        this.terrain.length = MAX_TERRAIN;

        console.warn(`${this.id}: More than ${MAX_TERRAIN} terrains detected!`);
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