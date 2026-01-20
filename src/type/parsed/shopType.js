import { ENTITY_CATEGORY } from "../../enums.js";

export const ShopType = function(id, config) {
    const { 
        land = [],
        sea = [],
        air = []
    } = config;

    this.id = id;
    this.categories = [];

    for(let i = 0; i < ENTITY_CATEGORY.COUNT; i++) {
        this.categories[i] = [];
    }

    this.categories[ENTITY_CATEGORY.LAND] = land;
    this.categories[ENTITY_CATEGORY.SEA] = sea;
    this.categories[ENTITY_CATEGORY.AIR] = air;
}