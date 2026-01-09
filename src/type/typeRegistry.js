import { TypeCategory } from "./typeCategory.js";
import { CommanderType } from "./parsed/commanderType.js";
import { FactionType } from "./parsed/factionType.js";
import { NationType } from "./parsed/nationType.js";
import { TerrainType } from "./parsed/terrainType.js";
import { TileType } from "./parsed/tileType.js";
import { TraitType } from "./parsed/traitType.js";
import { WeaponType } from "./parsed/weaponType.js";
import { ClimateType } from "./parsed/climateType.js";
import { MovementType } from "./parsed/movementType.js";
import { ArmorType } from "./parsed/armorType.js";
import { BuildingType } from "./parsed/buildingType.js";
import { MoraleType } from "./parsed/moraleType.js";
import { EntityType } from "./parsed/entityType.js";

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
    this.categories = [];

    const CATEGORY_NAME = {
        [TypeRegistry.CATEGORY.ENTITY]: "ENTITY",
        [TypeRegistry.CATEGORY.TRAIT]: "TRAIT",
        [TypeRegistry.CATEGORY.MOVEMENT]: "MOVEMENT",
        [TypeRegistry.CATEGORY.WEAPON]: "WEAPON",
        [TypeRegistry.CATEGORY.ARMOR]: "ARMOR",
        [TypeRegistry.CATEGORY.TERRAIN]: "TERRAIN",
        [TypeRegistry.CATEGORY.TILE]: "TILE",
        [TypeRegistry.CATEGORY.CLIMATE]: "CLIMATE",
        [TypeRegistry.CATEGORY.SCHEMA]: "SCHEMA",
        [TypeRegistry.CATEGORY.NATION]: "NATION",
        [TypeRegistry.CATEGORY.POWER]: "POWER",
        [TypeRegistry.CATEGORY.CURRENCY]: "CURRENCY",
        [TypeRegistry.CATEGORY.FACTION]: "FACTION",
        [TypeRegistry.CATEGORY.BUILDING]: "BUILDING",
        [TypeRegistry.CATEGORY.MORALE]: "MORALE",
        [TypeRegistry.CATEGORY.COMMANDER]: "COMMANDER"
    };

    const STUB = {
        [TypeRegistry.CATEGORY.SCHEMA]: SCHEMA_TYPES.BLACK,
        [TypeRegistry.CATEGORY.ENTITY]: new EntityType("ERROR_ENTITY", {}),
        [TypeRegistry.CATEGORY.MORALE]: new MoraleType("ERROR_MORALE", {}),
        [TypeRegistry.CATEGORY.BUILDING]: new BuildingType("ERROR_BUILDING", {}),
        [TypeRegistry.CATEGORY.ARMOR]: new ArmorType("ERROR_ARMOR", {}),
        [TypeRegistry.CATEGORY.MOVEMENT]: new MovementType("ERROR_MOVEMENT", {}),
        [TypeRegistry.CATEGORY.CLIMATE]: new ClimateType("ERROR_CLIMATE", {}),
        [TypeRegistry.CATEGORY.FACTION]: new FactionType("ERROR_FACTION", {}),
        [TypeRegistry.CATEGORY.NATION]: new NationType("ERROR_NATION", {}),
        [TypeRegistry.CATEGORY.COMMANDER]: new CommanderType("ERROR_COMMANDER", {}),
        [TypeRegistry.CATEGORY.WEAPON]: new WeaponType("ERROR_WEAPON", {}),
        [TypeRegistry.CATEGORY.TRAIT]: new TraitType("ERROR_TRAIT", {}),
        [TypeRegistry.CATEGORY.TILE]: new TileType("ERROR_TILE", {}),
        [TypeRegistry.CATEGORY.TERRAIN]: new TerrainType("ERROR_TERRAIN", {})
    };

    const count = Object.keys(TypeRegistry.CATEGORY).length;

    for(let i = 0; i < count; i++) {
        const name = CATEGORY_NAME[i] ?? "UNNAMED";
        const stub = STUB[i] ?? null;

        this.categories[i] = new TypeCategory(name, stub);
    }
}

TypeRegistry.CATEGORY = {
    ENTITY: 0,
    TRAIT: 1,
    MOVEMENT: 2,
    WEAPON: 3,
    ARMOR: 4,
    TERRAIN: 5,
    TILE: 6,
    CLIMATE: 7,
    SCHEMA: 8,
    NATION: 9,
    POWER: 10,
    CURRENCY: 11,
    FACTION: 12,
    BUILDING: 13,
    MORALE: 14,
    COMMANDER: 15
};

TypeRegistry.OBJECTIVE_TYPE = {
    DEFEAT: "DEFEAT",
    PROTECT: "PROTECT",
    CAPTURE: "CAPTURE",
    DEFEND: "DEFEND",
    SURVIVE: "SURVIVE",
    TIME_LIMIT: "TIME_LIMIT"
};

TypeRegistry.MORALE_TYPE = {
    NONE: "NONE"
};

TypeRegistry.ACTION_TYPE = {
    EXPLODE_TILE: "EXPLODE_TILE",
    CAPTURE: "CAPTURE",
    HEAL: "HEAL",
    END_TURN: "END_TURN",
    START_TURN: "START_TURN",
    MOVE: "MOVE",
    ATTACK: "ATTACK",
    CLOAK: "CLOAK",
    DEATH: "DEATH",
    UNCLOAK: "UNCLOAK"
};

TypeRegistry.ENTITY_TYPE = {
    LEVIATHAN_BARGE: "leviathan_barge",
    PELICAN_TRANSPORT: "pelican_transport",
    STORK_TRANSPORT: "stork_transport"
};

TypeRegistry.COMMANDER_TYPE = {
    KANYE: "KANYE"
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
    CAPTURABLE: "CAPTURABLE",
    CONQUEROR: "CONQUEROR",
    HIGH_ALTITUDE: "HIGH_ALTITUDE",
    RADAR: "RADAR",
    UNFAIR: "UNFAIR",
    BULLDOZE: "BULLDOZE",
    ANNIHILATE: "ANNIHILATE",
    LYNCHPIN: "LYNCHPIN",
    BLITZ: "BLITZ",
    SHRAPNEL: "SHRAPNEL",
    CLEAR_SHOT: "CLEAR_SHOT",
    ARMOR_PIERCE: "ARMOR_PIERCE",
    OVERHEAT: "OVERHEAT",
    TRACKING: "TRACKING",
    BLIND_SPOT: "BLIND_SPOT",
    HEROIC: "HEROIC",
    SLUGGER: "SLUGGER",
    ELUSIVE: "ELUSIVE",
    JAMMER: "JAMMER",
    FIXED: "FIXED",
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
    DEPTH_CHARGE: "DEPTH_CHARGE",
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

TypeRegistry.prototype.load = function(resources) {
    this.categories[TypeRegistry.CATEGORY.CURRENCY].setTypes(resources.currencyTypes, TypeRegistry.CURRENCY_TYPE);
    this.categories[TypeRegistry.CATEGORY.POWER].setTypes(resources.powerTypes, TypeRegistry.POWER_TYPE);
    this.categories[TypeRegistry.CATEGORY.SCHEMA].setTypes(SCHEMA_TYPES, TypeRegistry.SCHEMA_TYPE);

    this.categories[TypeRegistry.CATEGORY.ENTITY].loadTypes(resources.entityTypes, EntityType, TypeRegistry.ENTITY_TYPE);
    this.categories[TypeRegistry.CATEGORY.MORALE].loadTypes(resources.moraleTypes, MoraleType, TypeRegistry.MORALE_TYPE);
    this.categories[TypeRegistry.CATEGORY.ARMOR].loadTypes(resources.armorTypes, ArmorType, TypeRegistry.ARMOR_TYPE);
    this.categories[TypeRegistry.CATEGORY.CLIMATE].loadTypes(resources.climateTypes, ClimateType, TypeRegistry.CLIMATE_TYPE);
    this.categories[TypeRegistry.CATEGORY.MOVEMENT].loadTypes(resources.movementTypes, MovementType, TypeRegistry.MOVEMENT_TYPE);
    this.categories[TypeRegistry.CATEGORY.TERRAIN].loadTypes(resources.terrainTypes, TerrainType, TypeRegistry.TERRAIN_TYPE);
    this.categories[TypeRegistry.CATEGORY.TILE].loadTypes(resources.tileTypes, TileType, TypeRegistry.TILE_TYPE);
    this.categories[TypeRegistry.CATEGORY.TRAIT].loadTypes(resources.traitTypes, TraitType, TypeRegistry.TRAIT_TYPE);
    this.categories[TypeRegistry.CATEGORY.WEAPON].loadTypes(resources.weaponTypes, WeaponType, TypeRegistry.WEAPON_TYPE);
    this.categories[TypeRegistry.CATEGORY.NATION].loadTypes(resources.nationTypes, NationType, TypeRegistry.NATION_TYPE);
    this.categories[TypeRegistry.CATEGORY.FACTION].loadTypes(resources.factionTypes, FactionType, TypeRegistry.FACTION_TYPE);
    this.categories[TypeRegistry.CATEGORY.COMMANDER].loadTypes(resources.commanderTypes, CommanderType, TypeRegistry.COMMANDER_TYPE);
    this.categories[TypeRegistry.CATEGORY.BUILDING].loadTypes(resources.buildingTypes, BuildingType, TypeRegistry.BUILDING_TYPE);
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

TypeRegistry.prototype.getNationType = function(typeID) {
    return this.categories[TypeRegistry.CATEGORY.NATION].getType(typeID);
}

TypeRegistry.prototype.getFactionType = function(typeID) {
    return this.categories[TypeRegistry.CATEGORY.FACTION].getType(typeID);
}

TypeRegistry.prototype.getClimateType = function(typeID) {
    return this.categories[TypeRegistry.CATEGORY.CLIMATE].getType(typeID);
}

TypeRegistry.prototype.getMovementType = function(typeID) {
    return this.categories[TypeRegistry.CATEGORY.MOVEMENT].getType(typeID);
}

TypeRegistry.prototype.getArmorType = function(typeID) {
    return this.categories[TypeRegistry.CATEGORY.ARMOR].getType(typeID);
}

TypeRegistry.prototype.getBuildingType = function(typeID) {
    return this.categories[TypeRegistry.CATEGORY.BUILDING].getType(typeID);
}

TypeRegistry.prototype.getMoraleType = function(typeID) {
    return this.categories[TypeRegistry.CATEGORY.MORALE].getType(typeID);
}

TypeRegistry.prototype.getEntityType = function(typeID) {
    return this.categories[TypeRegistry.CATEGORY.ENTITY].getType(typeID);
}

TypeRegistry.prototype.getSchemaType = function(typeID) {
    return this.categories[TypeRegistry.CATEGORY.SCHEMA].getType(typeID);
}

TypeRegistry.prototype.getCurrencyType = function(typeID) {
    return this.categories[TypeRegistry.CATEGORY.CURRENCY].getType(typeID);
}