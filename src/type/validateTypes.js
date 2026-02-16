import { ENTITY_TYPE, TILE_TYPE, TRAIT_TYPE } from "../enums.js";
import { TypeRegistry } from "./typeRegistry.js";

export const validateTraitTypes = function(gameContext) {
    const { typeRegistry } = gameContext;
    const traitCategory = typeRegistry.categories[TypeRegistry.CATEGORY.TRAIT];

    traitCategory.checkEnums(TRAIT_TYPE);
}

export const validateTileTypes = function(gameContext) {
    const { typeRegistry } = gameContext;
    const tileCategory = typeRegistry.categories[TypeRegistry.CATEGORY.TILE];
    const terrainCategory = typeRegistry.categories[TypeRegistry.CATEGORY.TERRAIN];
    const { types } = tileCategory;

    for(const typeID in types) {
        const type = types[typeID];
        const { id, terrain } = type;

        for(const terrainID of terrain) {
            if(terrainCategory.types[terrainID] === undefined) {
                console.error(`TileType ${id} has a terrain that does not exist! ${terrainID}`);
            }
        }
    }

    tileCategory.checkEnums(TILE_TYPE);
}

export const validateEntityTypes = function(gameContext) {
    const { typeRegistry } = gameContext;
    const entityCategory = typeRegistry.categories[TypeRegistry.CATEGORY.ENTITY];
    const traitCategory = typeRegistry.categories[TypeRegistry.CATEGORY.TRAIT];
    const { types } = entityCategory;

    for(const typeID in types) {
        const type = types[typeID];
        const { id, traits } = type;

        for(const traitID of traits) {
            if(traitCategory.types[traitID] === undefined) {
                console.error(`Entity ${id} has a trait that does not exist! ${traitID}`);
            }
        }
    }

    entityCategory.checkEnums(ENTITY_TYPE);
}