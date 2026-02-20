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
import { ShopType } from "./parsed/shopType.js";
import { SchemaType } from "./parsed/schemaType.js";
import { ARMOR_TYPE, BUILDING_TYPE, CLIMATE_TYPE, MOVEMENT_TYPE, POWER_TYPE, TERRAIN_TYPE, TILE_TYPE, TRAIT_TYPE, WEAPON_TYPE } from "../enums.js";
import { PowerType } from "./parsed/powerType.js";

const STUB_WEAPON = new WeaponType(-1);
const STUB_TERRAIN = new TerrainType(-1);
const STUB_BUILDING = new BuildingType(-1);
const STUB_TRAIT = new TraitType(-1);
const STUB_CLIMATE = new ClimateType(-1);
const STUB_POWER = new PowerType(-1);
const STUB_ARMOR = new ArmorType(-1);
const STUB_MOVEMENT = new MovementType(-1);
const STUB_TILE = new TileType(-1);

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
        [TypeRegistry.CATEGORY.COMMANDER]: "COMMANDER",
        [TypeRegistry.CATEGORY.SHOP]: "SHOP"
    };

    const STUB = {
        [TypeRegistry.CATEGORY.SCHEMA]: new SchemaType("ERROR_SCHEMA", {}),
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
        [TypeRegistry.CATEGORY.TERRAIN]: new TerrainType("ERROR_TERRAIN", {}),
        [TypeRegistry.CATEGORY.SHOP]: new ShopType("ERROR_SHOP", {}),
    };

    const count = Object.keys(TypeRegistry.CATEGORY).length;

    for(let i = 0; i < count; i++) {
        const name = CATEGORY_NAME[i] ?? "UNNAMED";
        const stub = STUB[i] ?? null;

        this.categories[i] = new TypeCategory(name, stub);
    }

    this.tileTypes = [];
    this.movementTypes = [];
    this.armorTypes = [];
    this.powerTypes = [];
    this.climateTypes = [];
    this.traitTypes = [];
    this.buildingTypes = [];
    this.terrainTypes = [];
    this.weaponTypes = [];

    for(let i = 0; i < TILE_TYPE._COUNT; i++) {
        this.tileTypes[i] = new TileType(i);
    }

    for(let i = 0; i < MOVEMENT_TYPE._COUNT; i++) {
        this.movementTypes[i] = new MovementType(i);
    }

    for(let i = 0; i < ARMOR_TYPE._COUNT; i++) {
        this.armorTypes[i] = new ArmorType(i);
    }

    for(let i = 0; i < POWER_TYPE._COUNT; i++) {
        this.powerTypes[i] = new PowerType(i);
    }

    for(let i = 0; i < CLIMATE_TYPE._COUNT; i++) {
        this.climateTypes[i] = new ClimateType(i);
    }

    for(let i = 0; i < TRAIT_TYPE._COUNT; i++) {
        this.traitTypes[i] = new TraitType(i);
    }

    for(let i = 0; i < BUILDING_TYPE._COUNT; i++) {
        this.buildingTypes[i] = new BuildingType(i);
    }

    for(let i = 0; i < TERRAIN_TYPE._COUNT; i++) {
        this.terrainTypes[i] = new TerrainType(i);
    }

    for(let i = 0; i < WEAPON_TYPE._COUNT; i++) {
        this.weaponTypes[i] = new WeaponType(i);
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
    COMMANDER: 15,
    SHOP: 16
};

TypeRegistry.prototype.load = function(resources) {
    this.categories[TypeRegistry.CATEGORY.CURRENCY].setTypes(resources.currencyTypes);

    this.categories[TypeRegistry.CATEGORY.SCHEMA].loadTypes(resources.schemaTypes, SchemaType);
    this.categories[TypeRegistry.CATEGORY.ENTITY].loadTypes(resources.entityTypes, EntityType);
    this.categories[TypeRegistry.CATEGORY.MORALE].loadTypes(resources.moraleTypes, MoraleType);
    this.categories[TypeRegistry.CATEGORY.NATION].loadTypes(resources.nationTypes, NationType);
    this.categories[TypeRegistry.CATEGORY.FACTION].loadTypes(resources.factionTypes, FactionType);
    this.categories[TypeRegistry.CATEGORY.COMMANDER].loadTypes(resources.commanderTypes, CommanderType);
    this.categories[TypeRegistry.CATEGORY.BUILDING].loadTypes(resources.buildingTypes, BuildingType);
    this.categories[TypeRegistry.CATEGORY.SHOP].loadTypes(resources.shopTypes, ShopType);

    for(const typeID in resources.weaponTypes) {
        const config = resources.weaponTypes[typeID];
        const index = WEAPON_TYPE[typeID];

        if(index !== undefined) {
            this.weaponTypes[index].load(config, typeID);
        } else {
            //Type does not exist in JSON!
        }
    }

    for(const typeID in resources.terrainTypes) {
        const config = resources.terrainTypes[typeID];
        const index = TERRAIN_TYPE[typeID];

        if(index !== undefined) {
            this.terrainTypes[index].load(config, typeID);
        } else {
            //Type does not exist in JSON!
        }
    }

    for(const typeID in resources.buildingTypes) {
        const config = resources.buildingTypes[typeID];
        const index = BUILDING_TYPE[typeID];

        if(index !== undefined) {
            this.buildingTypes[index].load(config, typeID);
        } else {
            //Type does not exist in JSON!
        }
    }

    for(const typeID in resources.traitTypes) {
        const config = resources.traitTypes[typeID];
        const index = TRAIT_TYPE[typeID];

        if(index !== undefined) {
            this.traitTypes[index].load(config, typeID);
        } else {
            //Type does not exist in JSON!
        }
    }

    for(const typeID in resources.climateTypes) {
        const config = resources.climateTypes[typeID];
        const index = CLIMATE_TYPE[typeID];

        if(index !== undefined) {
            this.climateTypes[index].load(config, typeID);
        } else {
            //Type does not exist in JSON!
        }
    }

    for(const typeID in resources.powerTypes) {
        const config = resources.powerTypes[typeID];
        const index = POWER_TYPE[typeID];

        if(index !== undefined) {
            this.powerTypes[index].load(config, typeID);
        } else {
            //Type does not exist in JSON!
        }
    }

    for(const typeID in resources.armorTypes) {
        const config = resources.armorTypes[typeID];
        const index = ARMOR_TYPE[typeID];

        if(index !== undefined) {
            this.armorTypes[index].load(config, typeID);
        } else {
            //Type does not exist in JSON!
        }
    }

    for(const typeID in resources.movementTypes) {
        const config = resources.movementTypes[typeID];
        const index = MOVEMENT_TYPE[typeID];

        if(index !== undefined) {
            this.movementTypes[index].load(config, typeID);
        } else {
            //Type does not exist in JSON!
        }
    }

    for(const typeID in resources.tileTypes) {
        const config = resources.tileTypes[typeID];
        const index = TILE_TYPE[typeID];

        if(index !== undefined) {
            this.tileTypes[index].load(config, typeID);
        } else {
            //Type does not exist in JSON!
        }
    }
}

TypeRegistry.prototype.getTerrainType = function(typeID) {
    if(typeID < 0 || typeID >= TERRAIN_TYPE._COUNT) {
        return STUB_TERRAIN;
    }
    
    return this.terrainTypes[typeID];
}

TypeRegistry.prototype.getPowerType = function(typeID) {
    if(typeID < 0 || typeID >= POWER_TYPE._COUNT) {
        return STUB_POWER;
    }
    
    return this.powerTypes[typeID];
}

TypeRegistry.prototype.getTileType = function(typeID) {
    if(typeID < 0 || typeID >= TILE_TYPE._COUNT) {
        return STUB_TILE;
    }
    
    return this.tileTypes[typeID];
}

TypeRegistry.prototype.getTraitType = function(typeID) {
    if(typeID < 0 || typeID >= TRAIT_TYPE._COUNT) {
        return STUB_TRAIT;
    }
    
    return this.traitTypes[typeID];
}

TypeRegistry.prototype.getWeaponType = function(typeID) {
    if(typeID < 0 || typeID >= WEAPON_TYPE._COUNT) {
        return STUB_WEAPON;
    }
    
    return this.weaponTypes[typeID];
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
    if(typeID < 0 || typeID >= CLIMATE_TYPE._COUNT) {
        return STUB_CLIMATE;
    }
    
    return this.climateTypes[typeID];
}

TypeRegistry.prototype.getMovementType = function(typeID) {
    if(typeID < 0 || typeID >= MOVEMENT_TYPE._COUNT) {
        return STUB_MOVEMENT;
    }
    
    return this.movementTypes[typeID];
}

TypeRegistry.prototype.getArmorType = function(typeID) {
    if(typeID < 0 || typeID >= ARMOR_TYPE._COUNT) {
        return STUB_ARMOR;
    }
    
    return this.armorTypes[typeID];
}

TypeRegistry.prototype.getBuildingType = function(typeID) {
    if(typeID < 0 || typeID >= BUILDING_TYPE._COUNT) {
        return STUB_BUILDING;
    }
    
    return this.buildingTypes[typeID];
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

TypeRegistry.prototype.getShopType = function(typeID) {
    return this.categories[TypeRegistry.CATEGORY.SHOP].getType(typeID);
}