import { ARMOR_TYPE, MOVEMENT_TYPE } from "../../enums.js";

export const TraitType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_TRAIT";
    this.desc = "MISSING_DESC_TRAIT";
    this.icon = null;
    this.cashPerTurn = 0;
    this.moveDamage = [];
    this.armorDamage = [];

    for(let i = 0; i < MOVEMENT_TYPE._COUNT; i++) {
        this.moveDamage[i] = 0;
    }

    for(let i = 0; i < ARMOR_TYPE._COUNT; i++) {
        this.armorDamage[i] = 0;
    }
}

TraitType.prototype.load = function(config) {
    const {
        name = "MISSING_NAME_TRAIT",
        desc = "MISSING_DESC_TRAIT",
        icon = null,
        moveDamage = {},
        armorDamage = {},
        cashPerTurn = 0
    } = config;

    this.name = name;
    this.desc = desc;
    this.icon = icon;
    this.cashPerTurn = cashPerTurn;

    if(moveDamage['*'] !== undefined) {
        const defaultMoveDamage = moveDamage['*'];

        for(let i = 0; i < MOVEMENT_TYPE._COUNT; i++) {
            this.moveDamage[i] = defaultMoveDamage;
        }
    }

    if(armorDamage['*'] !== undefined) {
        const defaultArmorDamage = armorDamage['*'];

        for(let i = 0; i < ARMOR_TYPE._COUNT; i++) {
            this.armorDamage[i] = defaultArmorDamage;
        }
    }

    for(const typeID in moveDamage) {
        const index = MOVEMENT_TYPE[typeID];

        if(index !== undefined) {
            this.moveDamage[index] = moveDamage[typeID];
        }
    }

    for(const typeID in armorDamage) {
        const index = ARMOR_TYPE[typeID];

        if(index !== undefined) {
            this.armorDamage[index] = armorDamage[typeID];
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
    if(armorType < 0 || armorType >= ARMOR_TYPE._COUNT) {
        return 1;
    }

    return (1 + this.armorDamage[armorType]);
}