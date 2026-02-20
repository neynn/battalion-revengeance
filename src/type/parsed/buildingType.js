import { MAX_TRAITS } from "../../constants.js";
import { SHOP_TYPE, TRAIT_TYPE } from "../../enums.js";

export const BuildingType = function(id, config) {
    const {
        name = "MISSING_NAME_BUILDING",
        desc = "MISSING_DESC_BUILDING",
        sprite = null,
        traits = [],
        shop = SHOP_TYPE.NONE
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.sprite = sprite;
    this.shop = shop;
    this.traits = [];

    for(const traitID of traits) {
        const index = TRAIT_TYPE[traitID];

        if(index !== undefined) {
            this.traits.push(index);
        }
    }

    if(this.traits.length > MAX_TRAITS) {
        this.traits.length = MAX_TRAITS;

        console.warn(`${this.id}: More than ${MAX_TRAITS} traits detected!`);
    }
}