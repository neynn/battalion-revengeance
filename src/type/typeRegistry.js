import { CommanderType } from "./commanderType.js";
import { TerrainType } from "./terrainType.js";
import { TileType } from "./tileType.js";
import { TraitType } from "./traitType.js";
import { TypeCategory } from "./typeCategory.js";
import { WeaponType } from "./weaponType.js";

const SCHEMA_TYPES = {
    "RED": {
        0x661A5E: [0, 0, 0],
        0xAA162C: [0, 0, 0],
        0xE9332E: [0, 0, 0],
        0xFF9085: [0, 0, 0]
    },
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
        [TypeRegistry.CATEGORY.TRAIT]: new TypeCategory(TypeRegistry.CATEGORY.TRAIT, TypeRegistry.TRAIT_TYPE, TypeRegistry.STUB.TRAIT),
        [TypeRegistry.CATEGORY.MOVEMENT]: new TypeCategory(TypeRegistry.CATEGORY.MOVEMENT, TypeRegistry.MOVEMENT_TYPE),
        [TypeRegistry.CATEGORY.WEAPON]: new TypeCategory(TypeRegistry.CATEGORY.WEAPON, TypeRegistry.WEAPON_TYPE, TypeRegistry.STUB.WEAPON),
        [TypeRegistry.CATEGORY.ARMOR]: new TypeCategory(TypeRegistry.CATEGORY.ARMOR, TypeRegistry.ARMOR_TYPE),
        [TypeRegistry.CATEGORY.TERRAIN]: new TypeCategory(TypeRegistry.CATEGORY.TERRAIN, TypeRegistry.TERRAIN_TYPE, TypeRegistry.STUB.TERRAIN),
        [TypeRegistry.CATEGORY.TILE]: new TypeCategory(TypeRegistry.CATEGORY.TILE, TypeRegistry.TILE_TYPE, TypeRegistry.STUB.TILE),
        [TypeRegistry.CATEGORY.CLIMATE]: new TypeCategory(TypeRegistry.CATEGORY.CLIMATE, TypeRegistry.CLIMATE_TYPE),
        [TypeRegistry.CATEGORY.SCHEMA]: new TypeCategory(TypeRegistry.CATEGORY.SCHEMA, TypeRegistry.SCHEMA_TYPE),
        [TypeRegistry.CATEGORY.NATION]: new TypeCategory(TypeRegistry.CATEGORY.NATION, TypeRegistry.NATION_TYPE),
        [TypeRegistry.CATEGORY.POWER]: new TypeCategory(TypeRegistry.CATEGORY.POWER, TypeRegistry.POWER_TYPE),
        [TypeRegistry.CATEGORY.CURRENCY]: new TypeCategory(TypeRegistry.CATEGORY.CURRENCY, TypeRegistry.CURRENCY_TYPE),
        [TypeRegistry.CATEGORY.FACTION]: new TypeCategory(TypeRegistry.CATEGORY.FACTION, TypeRegistry.FACTION_TYPE),
        [TypeRegistry.CATEGORY.BUILDING]: new TypeCategory(TypeRegistry.CATEGORY.BUILDING, TypeRegistry.BUILDING_TYPE),
        [TypeRegistry.CATEGORY.MORALE]: new TypeCategory(TypeRegistry.CATEGORY.MORALE, TypeRegistry.MORALE_TYPE),
        [TypeRegistry.CATEGORY.COMMANDER]: new TypeCategory(TypeRegistry.CATEGORY.COMMANDER, TypeRegistry.COMMANDER_TYPE, TypeRegistry.STUB.COMMANDER)
    };
}

TypeRegistry.STUB = {
    COMMANDER: new CommanderType("ERROR_COMMANDER", {}),
    WEAPON: new WeaponType("ERROR_WEAPON", {}),
    TRAIT: new TraitType("ERROR_TRAIT", {}),
    TILE: new TileType("ERROR_TILE", {}),
    TERRAIN: new TerrainType("ERROR_TERRAIN", {})
};

TypeRegistry.LAYER_TYPE = {
    BUILDING: 0,
    SEA: 1,
    LAND: 2,
    GFX: 3,
    COUNT: 4
};

TypeRegistry.MORALE_TYPE = {
    NONE: "NONE"
};

TypeRegistry.ACTION_TYPE = {
    MOVE: "MOVE",
    ATTACK: "ATTACK",
    CLOAK: "CLOAK",
    DIALOGUE: "DIALOGUE",
    DEATH: "DEATH"
};

TypeRegistry.AUTOTILER_ID = {
    PATH: "battalion_path"
};

TypeRegistry.TILE_ID = {
    NONE: 0,
    GRASS: 1,
    BOREAL: 2,
    ARCTIC: 3,
    ROAD_0: 4,
    ROAD_1: 5,
    ROAD_2: 6,
    ROAD_3: 7,
    ROAD_4: 8,
    ROAD_5: 9,
    ROAD_6: 10,
    ROAD_7: 11,
    ROAD_8: 12,
    ROAD_9: 13,
    ROAD_10: 14,
    ROAD_11: 15,
    ROAD_12: 16,
    ROAD_13: 17,
    ROAD_14: 18,
    ROAD_15: 19,
    VOLANO: 20,
    //21-68: RIVER
    SHORE_0: 69,
    SHORE_1: 70,
    SHORE_2: 71,
    SHORE_3: 72,
    SHORE_4: 73,
    SHORE_5: 74,
    SHORE_6: 75,
    SHORE_7: 76,
    SHORE_8: 77,
    SHORE_9: 78,
    SHORE_10: 79,
    SHORE_11: 80,
    ISLAND_1: 81,
    ISLAND_2: 82,
    ISLAND_3: 83,
    ISLAND_4: 84,
    SWIRL_1: 85,
    SWIRL_2: 86,
    SWIRL_3: 87,
    SWIRL_4: 88,
    ROCKS_1: 89,
    ROCKS_2: 90,
    ROCKS_3: 91,
    ROCKS_4: 92,
    OVERLAY_MOVE: 93,
    OVERLAY_MOVE_ATTACK: 94,
    OVERLAY_ATTACK_LIGHT: 95,
    OVERLAY_ATTACK: 96,

    PATH_UP: 101,
    PATH_RIGHT: 102,
    PATH_DOWN: 103,
    PATH_LEFT: 104,
    PATH_CENTER: 105,

    JAMMER: 113
};

TypeRegistry.ENTITY_TYPE = {
    LEVIATHAN_BARGE: "leviathan_barge",
    PELICAN_TRANSPORT: "pelican_transport",
    STORK_TRANSPORT: "stork_transport"
};

TypeRegistry.COMMANDER_TYPE = {
    KANYE: "KANYE"
};

TypeRegistry.EVENT_TYPE = {
    DIALOGUE: "DIALOGUE",
    EXPLODE_TILE: "EXPLODE_TILE",
    SPAWN_ENTITY: "SPAWN_ENTITY"
};

TypeRegistry.CATEGORY = {
    TRAIT: "TRAIT",
    MOVEMENT: "MOVEMENT",
    WEAPON: "WEAPON",
    ARMOR: "ARMOR",
    TERRAIN: "TERRAIN",
    TILE: "TILE",
    CLIMATE: "CLIMATE",
    SCHEMA: "SCHEMA",
    NATION: "NATION",
    POWER: "POWER",
    CURRENCY: "CURRENCY",
    FACTION: "FACTION",
    BUILDING: "BUILDING",
    MORALE: "MORALE",
    COMMANDER: "COMMANDER"
};

TypeRegistry.BUILDING_TYPE = {
    AIR_CONTROL: "AIR_CONTROL",
    COMMAND_CENTER: "COMMAND_CENTER",
    FACTORY: "FACTORY",
    GROUND_CONTROL: "GROUND_CONTROL",
    OIL_ADVANCED_REFINERY: "OIL_ADVANCED_REFINERY",
    OIL_REFINERY: "OIL_REFINERY",
    OIL_RIG: "OIL_RIG",
    SEA_CONTROL: "SEA_CONTROL"
};

TypeRegistry.FACTION_TYPE = {
    CONTINENTAL_SECURITY_LEAGUE: "CONTINENTAL_SECURITY_LEAGUE",
    GLORIOUS_COALLITION: "GLORIOUS_COALLITION",
    RED: "RED",
    BLUE: "BLUE",
    GREEN: "GREEN",
    YELLOW: "YELLOW",
    DARK_RED: "DARK_RED",
    DARK_BLUE: "DARK_BLUE",
    BRONZE: "BRONZE",
    DARK_GREEN: "DARK_GREEN",
    GOLD: "GOLD",
    CYAN: "CYAN",
    PINK: "PINK",
    WHITE: "WHITE",
    PURPLE: "PURPLE",
    BLACK: "BLACK",
    GRAY: "GRAY",
    CREAM: "CREAM",
    LIME: "LIME",
    WHITE: "WHITE"
};

TypeRegistry.OBJECTIVE_TYPE = {
    CAPTURE: "CAPTURE",
    DEFEND: "DEFEND",
    DEFEAT: "DEFEAT",
    PROTECT: "PROTECT",
    TIME_LIMIT: "TIME_LIMIT",
    SURVIVE: "SURVIVE"
};

TypeRegistry.CURRENCY_TYPE = {
    ZLOT: "ZLOT",
    KARGIL: "KARGIL",
    KRONE: "KRONE",
    PULA: "PULA",
    RIAL: "RIAL"
};

TypeRegistry.POWER_TYPE = {
    MAJOR: "MAJOR",
    MINOR: "MINOR",
    REGIONAL: "REGIONAL"
},

TypeRegistry.NATION_TYPE = {
    SOMERTIN: "SOMERTIN",
    KARGIT: "KARGIT",
    TRANSKAL: "TRANSKAL",
    POLASIE: "POLASIE",
    ELAM: "ELAM"
};

TypeRegistry.SCHEMA_TYPE = {
    RED: "RED",
    BLUE: "BLUE",
    GREEN: "GREEN",
    YELLOW: "YELLOW",
    DARK_RED: "DARK_RED",
    DARK_BLUE: "DARK_BLUE",
    BRONZE: "BRONZE",
    DARK_GREEN: "DARK_GREEN",
    GOLD: "GOLD",
    CYAN: "CYAN",
    PINK: "PINK",
    WHITE: "WHITE",
    PURPLE: "PURPLE",
    BLACK: "BLACK",
    GRAY: "GRAY",
    CREAM: "CREAM",
    LIME: "LIME"
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
    BRIDGE: "BRIDGE",
    VOLCANO: "VOLCANO"
};

TypeRegistry.TERRAIN_TYPE = {
    SHIELDED: "SHIELDED",
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
    HEAVY: "HEAVY",
    OMEGA: "OMEGA"
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
    BLIND_SPOT: "BLIND_SPOT",
    HEROIC: "HEROIC",
    SLUGGER: "SLUGGER",
    ELUSIVE: "ELUSIVE",
    JAMMER: "JAMMER",
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
    SELF_DESTRUCT: "SELF_DESTRUCT",
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

TypeRegistry.prototype.load = function(resources) {
    this.loadCategory(SCHEMA_TYPES, TypeRegistry.CATEGORY.SCHEMA);
    this.loadCategory(resources.armorTypes, TypeRegistry.CATEGORY.ARMOR);
    this.loadCategory(resources.climateTypes, TypeRegistry.CATEGORY.CLIMATE);
    this.loadCategory(resources.movementTypes, TypeRegistry.CATEGORY.MOVEMENT);
    this.categories[TypeRegistry.CATEGORY.TERRAIN].loadTypes(resources.terrainTypes, TerrainType);
    this.categories[TypeRegistry.CATEGORY.TILE].loadTypes(resources.tileTypes, TileType);
    this.categories[TypeRegistry.CATEGORY.TRAIT].loadTypes(resources.traitTypes, TraitType);
    this.categories[TypeRegistry.CATEGORY.WEAPON].loadTypes(resources.weaponTypes, WeaponType);
    this.loadCategory(resources.nationTypes, TypeRegistry.CATEGORY.NATION);
    this.loadCategory(resources.powerTypes, TypeRegistry.CATEGORY.POWER);
    this.loadCategory(resources.currencyTypes, TypeRegistry.CATEGORY.CURRENCY);
    this.loadCategory(resources.factionTypes, TypeRegistry.CATEGORY.FACTION);
    this.loadCategory(resources.buildingTypes, TypeRegistry.CATEGORY.BUILDING);
    this.loadCategory(resources.moraleTypes, TypeRegistry.CATEGORY.MORALE);
    this.categories[TypeRegistry.CATEGORY.COMMANDER].loadTypes(resources.commanderTypes, CommanderType);
}

TypeRegistry.prototype.getTerrainType = function(typeID) {
    return this.categories[TypeRegistry.CATEGORY.TERRAIN].getType(typeID);
}

TypeRegistry.prototype.getTileType = function(typeID) {
    return this.categories[TypeRegistry.CATEGORY.TILE].getType(typeID);
}

TypeRegistry.prototype.getTraitType = function(typeID) {
    return this.categories[TypeRegistry.CATEGORY.TRAIT].getType(typeID);
}

TypeRegistry.prototype.getWeaponType = function(typeID) {
    return this.categories[TypeRegistry.CATEGORY.WEAPON].getType(typeID);
}

TypeRegistry.prototype.getCommanderType = function(typeID) {
    return this.categories[TypeRegistry.CATEGORY.COMMANDER].getType(typeID);
}