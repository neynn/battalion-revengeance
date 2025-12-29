export const TraitType = function(id, config) {
    const {
        name = TraitType.MISSING_NAME,
        desc = TraitType.MISSING_DESC,
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

TraitType.MISSING_NAME = "MISSING_NAME_TRAIT";
TraitType.MISSING_DESC = "MISSING_DESC_TRAIT";