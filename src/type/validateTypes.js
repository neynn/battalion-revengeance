import { ENTITY_TYPE, TILE_TYPE, TRAIT_TYPE } from "../enums.js";
import { TypeRegistry } from "./typeRegistry.js";

export const validateTraitTypes = function(gameContext) {
    const { typeRegistry, language } = gameContext;
    const traitCategory = typeRegistry.categories[TypeRegistry.CATEGORY.TRAIT];
    const { types } = traitCategory;

    for(const typeID in types) {
        const type = types[typeID];
        const { name, desc } = type;
        const tName = language.getSystemTranslation(name);
        const tDesc = language.getSystemTranslation(desc);

        if(name === tName) {
            console.warn("Trait name not registered!", name);
        }

        if(desc === tDesc) {
            console.warn("Trait desc not registered!", desc);
        }
    }

    traitCategory.checkEnums(TRAIT_TYPE);
}

export const validateTileTypes = function(gameContext) {
    const { typeRegistry, language } = gameContext;
    const tileCategory = typeRegistry.categories[TypeRegistry.CATEGORY.TILE];
    const terrainCategory = typeRegistry.categories[TypeRegistry.CATEGORY.TERRAIN];
    const { types } = tileCategory;

    for(const typeID in types) {
        const type = types[typeID];
        const { id, name, desc, terrain } = type;
        const tName = language.getSystemTranslation(name);
        const tDesc = language.getSystemTranslation(desc);

        if(name === tName) {
            console.warn("Trait name not registered!", name);
        }

        if(desc === tDesc) {
            console.warn("Trait desc not registered!", desc);
        }

        for(const terrainID of terrain) {
            if(terrainCategory.types[terrainID] === undefined) {
                console.error(`TileType ${id} has a terrain that does not exist! ${terrainID}`);
            }
        }
    }

    tileCategory.checkEnums(TILE_TYPE);
}

export const validateEntityTypes = function(gameContext) {
    const { typeRegistry, language } = gameContext;
    const entityCategory = typeRegistry.categories[TypeRegistry.CATEGORY.ENTITY];
    const traitCategory = typeRegistry.categories[TypeRegistry.CATEGORY.TRAIT];
    const { types } = entityCategory;

    for(const typeID in types) {
        const type = types[typeID];
        const { id, name, desc, traits } = type;
        const tName = language.getSystemTranslation(name);
        const tDesc = language.getSystemTranslation(desc);

        if(name === tName) {
            console.warn("Trait name not registered!", name);
        }

        if(desc === tDesc) {
            console.warn("Trait desc not registered!", desc);
        }

        for(const traitID of traits) {
            if(traitCategory.types[traitID] === undefined) {
                console.error(`Entity ${id} has a trait that does not exist! ${traitID}`);
            }
        }
    }

    entityCategory.checkEnums(ENTITY_TYPE);
}