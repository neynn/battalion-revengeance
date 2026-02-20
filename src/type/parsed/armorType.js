import { WEAPON_TYPE } from "../../enums.js";

export const ArmorType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_ARMOR";
    this.desc = "MISSING_DESC_ARMOR";
    this.icon = null;
    this.resistance = [];

    for(let i = 0; i < WEAPON_TYPE._COUNT; i++) {
        this.resistance[i] = 0;
    }
}

ArmorType.prototype.load = function(config, DEBUG_NAME) {
    const {
        name = "MISSING_NAME_ARMOR",
        desc = "MISSING_DESC_ARMOR",
        icon = null,
        resistance = {}
    } = config;

    this.name = name;
    this.desc = desc;
    this.icon = icon;

    if(resistance['*'] !== undefined) {
        const defaultResistance = resistance['*'];

        for(let i = 0; i < WEAPON_TYPE._COUNT; i++) {
            this.resistance[i] = defaultResistance;
        }
    }

    for(const weaponID in resistance) {
        const index = WEAPON_TYPE[weaponID];

        if(index !== undefined) {
            this.resistance[index] = resistance[weaponID];
        } else {
            console.warn(`${DEBUG_NAME}: Weapon ${weaponID} does not exist!`);
        }
    }
}

ArmorType.prototype.getResistance = function(weaponType) {
    if(weaponType < 0 || weaponType >= WEAPON_TYPE._COUNT) {
        return 0;
    }

   return this.resistance[weaponType];
}