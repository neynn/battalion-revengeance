export const TerrainType = function(id, config) {
    const { 
        name = "MISSING_NAME_TERRAIN",
        desc = "MISSING_DESC_TERRAIN",
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