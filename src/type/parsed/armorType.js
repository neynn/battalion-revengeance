import { ARMOR_TYPE, ICON_TYPE, WEAPON_TYPE } from "../../enums.js";

export const ArmorType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_ARMOR";
    this.desc = "MISSING_DESC_ARMOR";
    this.icon = ICON_TYPE.NONE;
    this.damageModifier = [];

    for(let i = 0; i < WEAPON_TYPE._COUNT; i++) {
        this.damageModifier[i] = 0;
    }
}

ArmorType.prototype.load = function(config, DEBUG_NAME) {
    const {
        name = "MISSING_NAME_ARMOR",
        desc = "MISSING_DESC_ARMOR",
        icon = "NONE",
        damageModifier = {}
    } = config;

    this.name = name;
    this.desc = desc;
    this.icon = ICON_TYPE[icon] ?? ICON_TYPE.NONE;

    if(damageModifier['*'] !== undefined) {
        const defaultModifier = damageModifier['*'];

        for(let i = 0; i < WEAPON_TYPE._COUNT; i++) {
            this.damageModifier[i] = defaultModifier;
        }
    }

    for(const weaponID in damageModifier) {
        const index = WEAPON_TYPE[weaponID];

        if(index !== undefined) {
            this.damageModifier[index] = damageModifier[weaponID];
        } else {
            console.warn(`${DEBUG_NAME}: Weapon ${weaponID} does not exist!`);
        }
    }

    //Caps damage reduction at 100%
    for(let i = 0; i < WEAPON_TYPE._COUNT; i++) {
        if(this.damageModifier[i] > 1) {
            this.damageModifier[i] = 1;
        }
    }
}

ArmorType.prototype.getDamageModifier = function(weaponType) {
    if(weaponType < 0 || weaponType >= WEAPON_TYPE._COUNT) {
        return 0;
    }

    return this.damageModifier[weaponType];
}