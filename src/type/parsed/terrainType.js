export const TerrainType = function(id, config) {
    const { 
        name = TerrainType.MISSING_NAME,
        desc = TerrainType.MISSING_DESC,
        icon = null,
        rangeGuard = false,
        rangeBoost = 0,
        damage = {},
        protection = {},
        cost = {}
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.icon = icon;
    this.rangeGuard = rangeGuard;
    this.rangeBoost = rangeBoost;
    this.damage = damage;
    this.protection = protection;
    this.cost = cost;
}

TerrainType.MISSING_NAME = "MISSING_NAME_TERRAIN";
TerrainType.MISSING_DESC = "MISSING_DESC_TERRAIN";