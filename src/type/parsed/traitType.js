import { MOVEMENT_TYPE } from "../../enums.js";

export const TraitType = function(id, config) {
    const {
        name = "MISSING_NAME_TRAIT",
        desc = "MISSING_DESC_TRAIT",
        icon = null,
        moveDamage = {},
        armorDamage = {},
        cashPerTurn = 0
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.icon = icon;
    this.cashPerTurn = cashPerTurn;
    this.moveDamage = [];
    this.armorDamage = armorDamage;
    this.defaultMoveDamage = 0;
    this.defaultArmorDamage = 0;

    for(let i = 0; i < MOVEMENT_TYPE._COUNT; i++) {
        this.moveDamage[i] = 0;
    }

    if(moveDamage['*'] !== undefined) {
        const defaultMoveDamage = moveDamage['*'];

        for(let i = 0; i < MOVEMENT_TYPE._COUNT; i++) {
            this.moveDamage[i] = defaultMoveDamage;
        }
    }

    if(armorDamage['*'] !== undefined) {
        const defaultArmorDamage = armorDamage['*'];

        //TODO: ARMOR
    }

    for(const typeID in moveDamage) {
        const index = MOVEMENT_TYPE[typeID];

        if(index !== undefined) {
            this.moveDamage[index] = moveDamage[typeID];
        }
    }
}

TraitType.prototype.getMoveDamage = function(movementType) {
    if(movementType < 0 || movementType >= MOVEMENT_TYPE._COUNT) {
        return 1;
    }

    return (1 + this.moveDamage[movementType]);
}

TraitType.prototype.getArmorDamage = function(armorType) {
    return (1 + (this.armorDamage[armorType] ?? this.armorDamage['*'] ?? 0));
}