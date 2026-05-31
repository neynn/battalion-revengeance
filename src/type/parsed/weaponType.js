import { ARMOR_TYPE, ICON_TYPE } from "../../enums.js";

export const WeaponType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_WEAPON";
    this.desc = "MISSING_DESC_WEAPON";
    this.icon = ICON_TYPE.NONE;
    this.damageMultiplier = [];

    for(let i = 0; i < ARMOR_TYPE._COUNT; i++) {
        this.damageMultiplier[i] = 1;
    }
}

WeaponType.prototype.load = function(config, DEBUG_NAME) {
    const {
        name = "MISSING_NAME_WEAPON",
        desc = "MISSING_DESC_WEAPON",
        icon = "NONE",
        damageMultiplier = {}
    } = config;

    this.name = name;
    this.desc = desc;
    this.icon = ICON_TYPE[icon] ?? ICON_TYPE.NONE;

    if(damageMultiplier['*'] !== undefined) {
        for(let i = 0; i < ARMOR_TYPE._COUNT; i++) {
            this.damageMultiplier[i] = damageMultiplier['*'];
        }
    }

    for(const armorID in damageMultiplier) {
        const index = ARMOR_TYPE[armorID];

        if(index !== undefined) {
            this.damageMultiplier[index] = damageMultiplier[armorID];
        } else {
            console.warn(`${DEBUG_NAME}: Armor ${armorID} does not exist!`);
        }
    }

    for(let i = 0; i < ARMOR_TYPE._COUNT; i++) {
        if(this.damageMultiplier[i] < 0) {
            this.damageMultiplier[i] = 0;

            console.warn(`${DEBUG_NAME}: DamageMultiplier for ${i} is below 0!`);
        }
    }
}

WeaponType.prototype.getDamageMultiplier = function(armorType) {
    if(armorType < 0 || armorType >= ARMOR_TYPE._COUNT) {
        return 1;
    }

    return this.damageMultiplier[armorType];
}