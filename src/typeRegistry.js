import { TypeCategory } from "./typeCategory.js";

const SCHEMA_TYPES = {
    "BLUE": {
        0x661A5E: [61, 49, 127],
        0xAA162C: [43, 95, 199],
        0xE9332E: [69, 164, 225],
        0xFF9085: [169, 207, 255]
    },
    "GREEN": {
        0x661A5E: [30, 91, 35],
        0xAA162C: [95, 147, 95],
        0xE9332E: [143, 222, 101],
        0xFF9085: [241, 246, 95]
    },
    "YELLOW": {
        0x661A5E: [134, 114, 52],
        0xAA162C: [217, 164, 73],
        0xE9332E: [242, 225, 104],
        0xFF9085: [255, 255, 160]
    },
    "DARK_RED": {
        0x661A5E: [42, 33, 52],
        0xAA162C: [78, 12, 35],
        0xE9332E: [138, 26, 17],
        0xFF9085: [220, 86, 86]
    },
    "DARK_BLUE": {
        0x661A5E: [30, 28, 59],
        0xAA162C: [22, 39, 117],
        0xE9332E: [65, 68, 147],
        0xFF9085: [99, 112, 173]
    },
    "BRONZE": {
        0x661A5E: [50, 42, 50],
        0xAA162C: [95, 69, 104],
        0xE9332E: [150, 125, 41],
        0xFF9085: [216, 147, 69]
    },
    "DARK_GREEN": {
        0x661A5E: [53, 61, 25],
        0xAA162C: [65, 91, 13],
        0xE9332E: [130, 156, 39],
        0xFF9085: [203, 212, 68]
    },
    "GOLD": {
        0x661A5E: [95, 56, 65],
        0xAA162C: [199, 65, 52],
        0xE9332E: [255, 182, 14],
        0xFF9085: [255, 255, 69]
    },
    "CYAN": {
        0x661A5E: [95, 86, 151],
        0xAA162C: [69, 147, 99],
        0xE9332E: [151, 216, 238],
        0xFF9085: [255, 255, 203]
    },
    "PINK": {
        0x661A5E: [114, 36, 82],
        0xAA162C: [196, 84, 129],
        0xE9332E: [255, 143, 182],
        0xFF9085: [255, 215, 220]
    },
    "WHITE": {
        0x661A5E: [106, 103, 141],
        0xAA162C: [179, 193, 220],
        0xE9332E: [229, 232, 255],
        0xFF9085: [245, 245, 255]
    },
    "PURPLE": {
        0x661A5E: [39, 43, 49],
        0xAA162C: [86, 69, 160],
        0xE9332E: [147, 130, 225],
        0xFF9085: [203, 194, 255]
    },
    "BLACK": {
        0x661A5E: [28, 29, 39],
        0xAA162C: [40, 44, 50],
        0xE9332E: [66, 65, 68],
        0xFF9085: [71, 75, 136]
    },
    "GRAY": {
        0x661A5E: [43, 49, 52],
        0xAA162C: [66, 67, 91],
        0xE9332E: [155, 151, 151],
        0xFF9085: [200, 190, 163]
    },
    "CREAM": {
        0x661A5E: [105, 125, 108],
        0xAA162C: [197, 171, 159],
        0xE9332E: [232, 223, 192],
        0xFF9085: [255, 255, 255]
    },
    "LIME": {
        0x661A5E: [92, 107, 42],
        0xAA162C: [49, 166, 26],
        0xE9332E: [55, 225, 54],
        0xFF9085: [121, 255, 128]
    }
};

export const TypeRegistry = function() {
    this.categories = {
        [TypeRegistry.CATEGORY.TRAIT]: new TypeCategory(TypeRegistry.CATEGORY.TRAIT, TypeRegistry.TRAIT_TYPE),
        [TypeRegistry.CATEGORY.MOVEMENT]: new TypeCategory(TypeRegistry.CATEGORY.MOVEMENT, TypeRegistry.MOVEMENT_TYPE),
        [TypeRegistry.CATEGORY.WEAPON]: new TypeCategory(TypeRegistry.CATEGORY.WEAPON, TypeRegistry.WEAPON_TYPE),
        [TypeRegistry.CATEGORY.ARMOR]: new TypeCategory(TypeRegistry.CATEGORY.ARMOR, TypeRegistry.ARMOR_TYPE),
        [TypeRegistry.CATEGORY.TERRAIN]: new TypeCategory(TypeRegistry.CATEGORY.TERRAIN, TypeRegistry.TERRAIN_TYPE),
        [TypeRegistry.CATEGORY.TILE]: new TypeCategory(TypeRegistry.CATEGORY.TILE, TypeRegistry.TILE_TYPE),
        [TypeRegistry.CATEGORY.CLIMATE]: new TypeCategory(TypeRegistry.CATEGORY.CLIMATE, TypeRegistry.CLIMATE_TYPE),
        [TypeRegistry.CATEGORY.SCHEMA]: new TypeCategory(TypeRegistry.CATEGORY.SCHEMA, TypeRegistry.SCHEMA_TYPE)
    };

    this.loadCategory(SCHEMA_TYPES, TypeRegistry.CATEGORY.SCHEMA);
}

TypeRegistry.CATEGORY = {
    TRAIT: "TRAIT",
    MOVEMENT: "MOVEMENT",
    WEAPON: "WEAPON",
    ARMOR: "ARMOR",
    TERRAIN: "TERRAIN",
    TILE: "TILE",
    CLIMATE: "CLIMATE",
    SCHEMA: "SCHEMA"
};

TypeRegistry.OBJECTIVE_TYPE = {
    CAPTURE: "CAPTURE",
    DEFEND: "DEFEND",
    DEFEAT: "DEFEAT",
    PROTECT: "PROTECT"
};

TypeRegistry.SCHEMA_TYPE = {
    "RED": "RED",
    "BLUE": "BLUE",
    "GREEN": "GREEN",
    "YELLOW": "YELLOW",
    "DARK_RED": "DARK_RED",
    "DARK_BLUE": "DARK_BLUE",
    "BRONZE": "BRONZE",
    "DARK_GREEN": "DARK_GREEN",
    "GOLD": "GOLD",
    "CYAN": "CYAN",
    "PINK": "PINK",
    "WHITE": "WHITE",
    "PURPLE": "PURPLE",
    "BLACK": "BLACK",
    "GRAY": "GRAY",
    "CREAM": "CREAM",
    "LIME": "LIME"
};

TypeRegistry.CLIMATE_TYPE = {
    NONE: "NONE",
    TEMPERATE: "TEMPERATE",
    ARID: "ARID",
    BOREAL: "BOREAL",
    BARREN: "BARREN",
    ARCTIC: "ARCTIC",
    LUNAR: "LUNAR",
    MARTIAN: "MARTIAN",
    HELLISH: "HELLISH"
};

TypeRegistry.TILE_TYPE = {
    NONE: "NONE",
    GRASS: "GRASS",
    BOREAL: "BOREAL",
    ARCTIC: "ARCTIC",
    SHORE: "SHORE",
    ISLAND: "ISLAND",
    SWIRL: "SWIRL",
    ROCKS: "ROCKS",
    RIVER: "RIVER",
    ROAD: "ROAD",
    VOLCANO: "VOLCANO"
};

TypeRegistry.TERRAIN_TYPE = {
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
    INERTIAL: "INERTIAL",
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

TypeRegistry.prototype.getDisplayName = function(gameContext, typeID, categoryID) {
    const { language } = gameContext;
    const type = this.getType(typeID, categoryID);

    if(type) {
        if(type.name) {
            return language.getSystemTag(type.name);
        }
    }

    return language.getSystemTag("TYPE_REGISTRY_MISSING_NAME");
}

TypeRegistry.prototype.getDisplayDesc = function(gameContext, typeID, categoryID) {
    const { language } = gameContext;
    const type = this.getType(typeID, categoryID);

    if(type) {
        if(type.desc) {
            return language.getSystemTag(type.desc);
        }
    }

    return language.getSystemTag("TYPE_REGISTRY_MISSING_DESC");
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

TypeRegistry.prototype.getTerrainTags = function(tileID) {
    const tags = [];
    const type = this.getType(tileID, TypeRegistry.CATEGORY.TILE);

    if(type) {
        const { terrain } = type;

        if(terrain) {
            for(let i = 0; i < terrain.length; i++) {
                tags.push(terrain[i]);
            }
        }
    }

    return tags;
}

TypeRegistry.prototype.getClimateType = function(tileID) {
    const type = this.getType(tileID, TypeRegistry.CATEGORY.TILE);

    if(type) {
        const { climate = TypeRegistry.CLIMATE_TYPE.NONE } = type;

        return climate;
    }

    return TypeRegistry.CLIMATE_TYPE.NONE;
}