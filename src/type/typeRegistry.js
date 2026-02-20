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
import { ARMOR_TYPE, BUILDING_TYPE, CLIMATE_TYPE, COMMANDER_TYPE, CURRENCY_TYPE, ENTITY_TYPE, FACTION_TYPE, MORALE_TYPE, MOVEMENT_TYPE, NATION_TYPE, POWER_TYPE, SCHEMA_TYPE, SHOP_TYPE, TERRAIN_TYPE, TILE_TYPE, TRAIT_TYPE, WEAPON_TYPE } from "../enums.js";
import { PowerType } from "./parsed/powerType.js";
import { CurrencyType } from "./parsed/currencyType.js";

const STUB_ENTITY = new EntityType(-1);
const STUB_SCHEMA = new SchemaType(-1);
const STUB_MORALE = new MoraleType(-1);
const STUB_SHOP = new ShopType(-1);
const STUB_FACTION = new FactionType(-1);
const STUB_COMMANDER = new CommanderType(-1);
const STUB_CURRENCY = new CurrencyType(-1);
const STUB_NATION = new NationType(-1);
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
    this.tileTypes = [];
    this.movementTypes = [];
    this.armorTypes = [];
    this.powerTypes = [];
    this.climateTypes = [];
    this.traitTypes = [];
    this.buildingTypes = [];
    this.terrainTypes = [];
    this.weaponTypes = [];
    this.nationTypes = [];
    this.currencyTypes = [];
    this.commanderTypes = [];
    this.factionTypes = [];
    this.shopTypes = [];
    this.moraleTypes = [];
    this.schemaTypes = [];
    this.entityTypes = [];

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

    for(let i = 0; i < NATION_TYPE._COUNT; i++) {
        this.nationTypes[i] = new NationType(i);
    }

    for(let i = 0; i < CURRENCY_TYPE._COUNT; i++) {
        this.currencyTypes[i] = new CurrencyType(i);
    }

    for(let i = 0; i < COMMANDER_TYPE._COUNT; i++) {
        this.commanderTypes[i] = new CommanderType(i);
    }

    for(let i = 0; i < FACTION_TYPE._COUNT; i++) {
        this.factionTypes[i] = new FactionType(i);
    }

    for(let i = 0; i < SHOP_TYPE._COUNT; i++) {
        this.shopTypes[i] = new ShopType(i);
    }

    for(let i = 0; i < MORALE_TYPE._COUNT; i++) {
        this.moraleTypes[i] = new MoraleType(i);
    }

    for(let i = 0; i < SCHEMA_TYPE._COUNT; i++) {
        this.schemaTypes[i] = new SchemaType(i);
    }

    for(let i = 0; i < ENTITY_TYPE._COUNT; i++) {
        this.entityTypes[i] = new EntityType(i);
    }
}

TypeRegistry.prototype.load = function(resources) {
    for(const typeID in resources.entityTypes) {
        const config = resources.entityTypes[typeID];
        const index = ENTITY_TYPE[typeID];

        if(index !== undefined) {
            this.entityTypes[index].load(config, typeID);
        } else {
            //Type does not exist in JSON!
        }
    }

    for(const typeID in resources.schemaTypes) {
        const config = resources.schemaTypes[typeID];
        const index = SCHEMA_TYPE[typeID];

        if(index !== undefined) {
            this.schemaTypes[index].load(config, typeID);
        } else {
            //Type does not exist in JSON!
        }
    }

    for(const typeID in resources.moraleTypes) {
        const config = resources.moraleTypes[typeID];
        const index = MORALE_TYPE[typeID];

        if(index !== undefined) {
            this.moraleTypes[index].load(config, typeID);
        } else {
            //Type does not exist in JSON!
        }
    }

    for(const typeID in resources.shopTypes) {
        const config = resources.shopTypes[typeID];
        const index = SHOP_TYPE[typeID];

        if(index !== undefined) {
            this.shopTypes[index].load(config, typeID);
        } else {
            //Type does not exist in JSON!
        }
    }

    for(const typeID in resources.factionTypes) {
        const config = resources.factionTypes[typeID];
        const index = FACTION_TYPE[typeID];

        if(index !== undefined) {
            this.factionTypes[index].load(config, typeID);
        } else {
            //Type does not exist in JSON!
        }
    }

    for(const typeID in resources.commanderTypes) {
        const config = resources.commanderTypes[typeID];
        const index = COMMANDER_TYPE[typeID];

        if(index !== undefined) {
            this.commanderTypes[index].load(config, typeID);
        } else {
            //Type does not exist in JSON!
        }
    }

    for(const typeID in resources.currencyTypes) {
        const config = resources.currencyTypes[typeID];
        const index = CURRENCY_TYPE[typeID];

        if(index !== undefined) {
            this.currencyTypes[index].load(config, typeID);
        } else {
            //Type does not exist in JSON!
        }
    }


    for(const typeID in resources.nationTypes) {
        const config = resources.nationTypes[typeID];
        const index = NATION_TYPE[typeID];

        if(index !== undefined) {
            this.nationTypes[index].load(config, typeID);
        } else {
            //Type does not exist in JSON!
        }
    }

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

TypeRegistry.prototype.getEntityType = function(typeID) {
    if(typeID < 0 || typeID >= ENTITY_TYPE._COUNT) {
        return STUB_ENTITY;
    }
    
    return this.entityTypes[typeID];
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
    if(typeID < 0 || typeID >= COMMANDER_TYPE._COUNT) {
        return STUB_COMMANDER;
    }
    
    return this.commanderTypes[typeID];
}

TypeRegistry.prototype.getNationType = function(typeID) {
    if(typeID < 0 || typeID >= NATION_TYPE._COUNT) {
        return STUB_NATION;
    }
    
    return this.nationTypes[typeID];
}

TypeRegistry.prototype.getFactionType = function(typeID) {
    if(typeID < 0 || typeID >= FACTION_TYPE._COUNT) {
        return STUB_FACTION;
    }
    
    return this.factionTypes[typeID];
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
    if(typeID < 0 || typeID >= MORALE_TYPE._COUNT) {
        return STUB_MORALE;
    }
    
    return this.moraleTypes[typeID];
}

TypeRegistry.prototype.getSchemaType = function(typeID) {
    if(typeID < 0 || typeID >= SCHEMA_TYPE._COUNT) {
        return STUB_SCHEMA;
    }
    
    return this.schemaTypes[typeID];
}

TypeRegistry.prototype.getCurrencyType = function(typeID) {
    if(typeID < 0 || typeID >= CURRENCY_TYPE._COUNT) {
        return STUB_CURRENCY;
    }
    
    return this.currencyTypes[typeID];
}

TypeRegistry.prototype.getShopType = function(typeID) {
    if(typeID < 0 || typeID >= SHOP_TYPE._COUNT) {
        return STUB_SHOP;
    }
    
    return this.shopTypes[typeID];
}