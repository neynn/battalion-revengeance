import { TypeCategory } from "./typeCategory.js";

export const TypeRegistry = function() {
    this.categories = {
        [TypeRegistry.CATEGORY.TRAIT]: new TypeCategory(TypeRegistry.CATEGORY.TRAIT, TypeRegistry.TRAIT_TYPE),
        [TypeRegistry.CATEGORY.MOVEMENT]: new TypeCategory(TypeRegistry.CATEGORY.MOVEMENT, TypeRegistry.MOVEMENT_TYPE),
        [TypeRegistry.CATEGORY.WEAPON]: new TypeCategory(TypeRegistry.CATEGORY.WEAPON, TypeRegistry.WEAPON_TYPE),
        [TypeRegistry.CATEGORY.ARMOR]: new TypeCategory(TypeRegistry.CATEGORY.ARMOR, TypeRegistry.ARMOR_TYPE),
        [TypeRegistry.CATEGORY.TERRAIN]: new TypeCategory(TypeRegistry.CATEGORY.TERRAIN, TypeRegistry.TERRAIN_TYPE)
    };
}

TypeRegistry.CATEGORY = {
    TRAIT: "TRAIT",
    MOVEMENT: "MOVEMENT",
    WEAPON: "WEAPON",
    ARMOR: "ARMOR",
    TERRAIN: "TERRAIN"
};

TypeRegistry.TERRAIN_TYPE = {
    TEMPERATE: "TEMPERATE",
    ARID: "ARID",
    BOREAL: "BOREAL",
    BARREN: "BARREN",
    ARCTIC: "ARCTIC",
    LUNAR: "LUNAR",
    MARTIAN: "MARTIAN",
    UNEVEN: "UNEVEN",
    RUGGED: "RUGGED",
    PRECIPITOUS: "PRECIPITOUS",
    IMPASSABLE: "IMPASSABLE",
    TRICKY_WATERS: "TRICKY_WATERS",
    CONCEALMENT: "CONCEALMENT",
    NAVAL_CONCEALMENT: "NAVAL_CONCEALMENT",
    BUNKER: "BUNKER",
    SHALLOW: "SHALLOW",
    VANTAGE: "VANTAGE",
    DANGEROUS: "DANGEROUS"
};

TypeRegistry.ARMOR_TYPE = {
    NONE: "NONE",
    LIGHT: "LIGHT",
    MEDIUM: "MEDIUM",
    HEAVY: "HEAVY"
};

TypeRegistry.WEAPON_TYPE = {
    NONE: "NONE",
    LIGHT: "LIGHT",
    MEDIUM: "MEDIUM",
    HEAVY: "HEAVY"
};

TypeRegistry.MOVEMENT_TYPE = {
    STATIONARY: "STATIONARY",
    FOOT: "FOOT",
    WHEELED: "WHEELED",
    TRACKED: "TRACKED",
    FLIGHT: "FLIGHT",
    RUDDER: "RUDDER",
    HEAVY_RUDDER: "HEAVY_RUDDER",
    AMPHIBIOUS: "AMPHIBIOUS"
};

TypeRegistry.TRAIT_TYPE = {
    INDOMITABLE: "INDOMITABLE",
    COMMANDO: "COMMANDO",
    ANTI_INFANTRY: "ANTI_INFANTRY",
    ANTI_AIR: "ANTI_AIR",
    ANTI_SHIP: "ANTI_SHIP",
    ANTI_TANK: "ANTI_TANK",
    ANTI_STRUCTURE: "ANTI_STRUCTURE",
    STEER: "STEER",
    STEALTH: "STEALTH",
    SCHWERPUNKT: "SCHWERPUNKT",
    CEMENTED_STEEL_ARMOR: "CEMENTED_STEEL_ARMOR",
    SUPPLY_DISTRIBUTION: "SUPPLY_DISTRIBUTION",
    CAVITATION_EXPLOSION: "CAVITATION_EXPLOSION",
    SONAR: "SONAR",
    SUBMERGED: "SUBMERGED",
    TANK_HUNTER: "TANK_HUNTER",
    SUICIDE: "SUICIDE",
    SKYSWEEPER: "SKYSWEEPER",
    DEPTH_STRIKE: "DEPTH_STRIKE",
    SEABOUND: "SEABOUND",
    TERRIFYING: "TERRIFYING",
    INFLAMING: "INFLAMING",
    ABSORBER: "ABSORBER",
    DISPERSION: "DISPERSION",
    JUDGEMENT: "JUDGEMENT",
    BEWEGUNGSKRIEG: "BEWEGUNGSKRIEG",
    MOBILE_BATTERY: "MOBILE_BATTERY",
    STREAMBLAST: "STREAMBLAST",
    AIR_TRANSPORT: "AIR_TRANSPORT",
    NAVAL_TRANSPORT: "NAVAL_TRANSPORT"
};

TypeRegistry.prototype.loadCategory = function(types, categoryID) {
    if(!types) {
        console.log("No types were given!");
        return;
    }

    if(!this.categories[categoryID]) {
        console.log(`Category ${categoryID} does not exist!`);
        return;
    }

    this.categories[categoryID].setTypes(types);
}

TypeRegistry.prototype.getType = function(typeID, categoryID) {
    if(!this.categories[categoryID]) {
        return null;
    }

    return this.categories[categoryID].getType(typeID);
}

TypeRegistry.prototype.getDisplayName = function(typeID, categoryID) {
    const type = this.getType(typeID, categoryID);

    if(type) {
        if(type.name) {
            return type.name;
        }
    }

    return "TYPE_REGISTRY_MISSING_NAME";
}

TypeRegistry.prototype.getDisplayDesc = function(typeID, categoryID) {
    const type = this.getType(typeID, categoryID);

    if(type) {
        if(type.desc) {
            return type.desc;
        }
    }

    return "TYPE_REGISTRY_MISSING_DESC";
}

TypeRegistry.prototype.getIconID = function(typeID, categoryID) {
    const type = this.getType(typeID, categoryID);

    if(type) {
        if(type.icon) {
            return type.icon;
        }
    }

    return null;
}