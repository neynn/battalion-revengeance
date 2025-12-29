export const TileType = function(id, config) {
    const {
        name = "MISSING_NAME_TILE",
        desc = "MISSING_DESC_TILE",
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