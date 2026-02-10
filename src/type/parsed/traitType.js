export const TraitType = function(id, config) {
    const {
        name = "MISSING_NAME_TRAIT",
        desc = "MISSING_DESC_TRAIT",
        icon = null,
        moveDamage =  {},
        armorDamage =  {},
        cashPerTurn = 0
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.icon = icon;
    this.moveDamage = moveDamage;
    this.armorDamage = armorDamage;
    this.cashPerTurn = cashPerTurn;
}

TraitType.prototype.getMoveDamage = function(movementType) {
    return (1 + (this.moveDamage[movementType] ?? this.moveDamage['*'] ?? 0));
}

TraitType.prototype.getArmorDamage = function(armorType) {
    return (1 + (this.armorDamage[armorType] ?? this.armorDamage['*'] ?? 0));
}