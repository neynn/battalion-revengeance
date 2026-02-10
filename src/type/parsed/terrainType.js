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

TerrainType.prototype.getDamage = function(movementType) {
    return this.damage[movementType] ?? this.damage['*'] ?? 0;
}

TerrainType.prototype.getCost = function(movementType) {
    return this.cost[movementType] ?? this.cost['*'] ?? 0;
}

TerrainType.prototype.getProtection = function(movementType) {
    return this.protection[movementType] ?? this.protection['*'] ?? 0;
}