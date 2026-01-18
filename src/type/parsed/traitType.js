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