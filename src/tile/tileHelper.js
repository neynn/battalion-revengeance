const TILE_FLAG = {
    WATER: 1 << 0,
    VOLCANO: 1 << 1
};


export const TileHelper = {
    getTileFlag: function(name) {
        const flag = TILE_FLAG[name];

        if(flag === undefined) {
            return 0;
        }

        return flag;
    }
};