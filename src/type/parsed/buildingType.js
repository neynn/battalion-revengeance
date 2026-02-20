import { MAX_TRAITS } from "../../constants.js";
import { SHOP_TYPE, TRAIT_TYPE } from "../../enums.js";

export const BuildingType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_BUILDING";
    this.desc = "MISSING_DESC_BUILDING";
    this.sprite = null;
    this.shop = SHOP_TYPE.NONE;
    this.traits = [];
}

BuildingType.prototype.load = function(config, DEBUG_NAME) {
       const {
        name = "MISSING_NAME_BUILDING",
        desc = "MISSING_DESC_BUILDING",
        sprite = null,
        traits = [],
        shop = SHOP_TYPE.NONE
    } = config; 

    this.name = name;
    this.desc = desc;
    this.sprite = sprite;
    this.shop = shop;

    for(const traitID of traits) {
        const index = TRAIT_TYPE[traitID];

        if(index !== undefined) {
            this.traits.push(index);
        }
    }

    if(this.traits.length > MAX_TRAITS) {
        this.traits.length = MAX_TRAITS;

        console.warn(`${DEBUG_NAME}: More than ${MAX_TRAITS} traits detected!`);
    }
}