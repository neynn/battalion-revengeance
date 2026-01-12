export const TileType = function(id, config) {
    const MAX_TERRAIN = 4;

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

    if(this.terrain.length > MAX_TERRAIN) {
        this.terrain.length = MAX_TERRAIN;

        console.warn(`${this.id}: More than ${MAX_TERRAIN} terrains detected!`);
    }
}