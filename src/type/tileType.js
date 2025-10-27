export const TileType = function(id, config) {
    const {
        name = TileType.MISSING_NAME,
        desc = TileType.MISSING_DESC,
        climate = "NONE",
        terrain = [],
        passability = {}
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.climate = climate;
    this.terrain = terrain;
    this.passability = passability;
}

TileType.MISSING_NAME = "MISSING_NAME_TILE";
TileType.MISSING_DESC = "MISSING_DESC_TILE";