import { ENTITY_CATEGORY, ICON_TYPE } from "../../enums.js";

export const BuildingTraitType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_BUILDING_TYPE";
    this.desc = "MISSING_DESC_BUILDING_TYPE";
    this.icon = ICON_TYPE.NONE;
    this.cashPerTurn = 0;
    this.costReduction = [];

    for(let i = 0; i < ENTITY_CATEGORY._COUNT; i++) {
        this.costReduction[i] = 0;
    }
}

BuildingTraitType.prototype.load = function(config, DEBUG_NAME) {
    const { 
        name = "MISSING_NAME_BUILDING_TYPE",
        desc = "MISSING_DESC_BUILDING_TYPE",
        icon = "NONE",
        cashPerTurn = 0,
        costReduction = {}
    } = config;

    this.name = name;
    this.desc = desc;
    this.icon = ICON_TYPE[icon] ?? ICON_TYPE.NONE;
    this.cashPerTurn = cashPerTurn;

    for(const categoryID in costReduction) {
        const index = ENTITY_CATEGORY[categoryID];

        if(index !== undefined) {
            this.costReduction[index] = Math.floor(costReduction[categoryID]);
        }
    }

    for(let i = 0; i < ENTITY_CATEGORY._COUNT; i++) {
        if(this.costReduction[i] < 0) {
            this.costReduction[i] = 0;
        }
    }
}

BuildingTraitType.prototype.getCostReduction = function(categoryID) {
    if(categoryID < 0 || categoryID >= ENTITY_CATEGORY._COUNT) {
        return 0;
    }
    
    return this.costReduction[categoryID];
}