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
import { ARMOR_TYPE, BUILDING_TYPE, CLIMATE_TYPE, COMMANDER_TYPE, CURRENCY_TYPE, ENTITY_TYPE, FACTION_TYPE, MINE_TYPE, MORALE_TYPE, MOVEMENT_TYPE, NATION_TYPE, POWER_TYPE, SCHEMA_TYPE, SHOP_TYPE, TERRAIN_TYPE, TILE_TYPE, TRAIT_TYPE, WEAPON_TYPE } from "../enums.js";
import { PowerType } from "./parsed/powerType.js";
import { CurrencyType } from "./parsed/currencyType.js";
import { MineType } from "./parsed/mineType.js";

const STUB_MINE = new MineType(-1);
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

const createTypeCategory = function(Type, count) {
    const list = [];

    for(let i = 0; i < count; i++) {
        list[i] = new Type(i);
    }

    return list;
}

const mLoadTypeCategory = function(types, list, mapper) {
    for(const typeID in types) {
        const config = types[typeID];
        const index = mapper[typeID];

        if(index !== undefined) {
            list[index].load(config, typeID);
        } else {
            //Type does not exist in JSON!
        }
    }  
}

export const TypeRegistry = function() {
    this.tileTypes = createTypeCategory(TileType, TILE_TYPE._COUNT);
    this.movementTypes = createTypeCategory(MovementType, MOVEMENT_TYPE._COUNT);
    this.armorTypes = createTypeCategory(ArmorType, ARMOR_TYPE._COUNT);
    this.powerTypes = createTypeCategory(PowerType, POWER_TYPE._COUNT);
    this.climateTypes = createTypeCategory(ClimateType, CLIMATE_TYPE._COUNT);
    this.traitTypes = createTypeCategory(TraitType, TRAIT_TYPE._COUNT);
    this.buildingTypes = createTypeCategory(BuildingType, BUILDING_TYPE._COUNT);
    this.terrainTypes = createTypeCategory(TerrainType, TERRAIN_TYPE._COUNT);
    this.weaponTypes = createTypeCategory(WeaponType, WEAPON_TYPE._COUNT);
    this.nationTypes = createTypeCategory(NationType, NATION_TYPE._COUNT);
    this.currencyTypes = createTypeCategory(CurrencyType, CURRENCY_TYPE._COUNT);
    this.commanderTypes = createTypeCategory(CommanderType, COMMANDER_TYPE._COUNT);
    this.factionTypes = createTypeCategory(FactionType, FACTION_TYPE._COUNT);
    this.shopTypes = createTypeCategory(ShopType, SHOP_TYPE._COUNT);
    this.moraleTypes = createTypeCategory(MoraleType, MORALE_TYPE._COUNT);
    this.schemaTypes = createTypeCategory(SchemaType, SCHEMA_TYPE._COUNT);
    this.entityTypes = createTypeCategory(EntityType, ENTITY_TYPE._COUNT);
    this.mineTypes = createTypeCategory(MineType, MINE_TYPE._COUNT);
}

TypeRegistry.prototype.load = function(resources) {
    mLoadTypeCategory(resources.entityTypes, this.entityTypes, ENTITY_TYPE);
    mLoadTypeCategory(resources.schemaTypes, this.schemaTypes, SCHEMA_TYPE);
    mLoadTypeCategory(resources.moraleTypes, this.moraleTypes, MORALE_TYPE);
    mLoadTypeCategory(resources.shopTypes, this.shopTypes, SHOP_TYPE);
    mLoadTypeCategory(resources.factionTypes, this.factionTypes, FACTION_TYPE);
    mLoadTypeCategory(resources.commanderTypes, this.commanderTypes, COMMANDER_TYPE);
    mLoadTypeCategory(resources.currencyTypes, this.currencyTypes, CURRENCY_TYPE);
    mLoadTypeCategory(resources.nationTypes, this.nationTypes, NATION_TYPE);
    mLoadTypeCategory(resources.weaponTypes, this.weaponTypes, WEAPON_TYPE);
    mLoadTypeCategory(resources.terrainTypes, this.terrainTypes, TERRAIN_TYPE);
    mLoadTypeCategory(resources.buildingTypes, this.buildingTypes, BUILDING_TYPE);
    mLoadTypeCategory(resources.traitTypes, this.traitTypes, TRAIT_TYPE);
    mLoadTypeCategory(resources.climateTypes, this.climateTypes, CLIMATE_TYPE);
    mLoadTypeCategory(resources.powerTypes, this.powerTypes, POWER_TYPE);
    mLoadTypeCategory(resources.armorTypes, this.armorTypes, ARMOR_TYPE);
    mLoadTypeCategory(resources.movementTypes, this.movementTypes, MOVEMENT_TYPE);
    mLoadTypeCategory(resources.tileTypes, this.tileTypes, TILE_TYPE);
    mLoadTypeCategory(resources.mineTypes, this.mineTypes, MINE_TYPE);
}

TypeRegistry.prototype.getMineType = function(typeID) {
    if(typeID < 0 || typeID >= MINE_TYPE._COUNT) {
        return STUB_MINE;
    }
    
    return this.mineTypes[typeID];
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