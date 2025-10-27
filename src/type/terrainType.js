export const TerrainType = function(id, config) {
    const { 
        name,
        desc,
        icon,
        rangeGuard = false,
        rangeBoost = 0,
        protection = {},
        cost = {}
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.icon = icon;
    this.rangeGuard = rangeGuard;
    this.rangeBoost = rangeBoost;
    this.protection = protection;
    this.cost = cost;
}