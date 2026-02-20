import { ENTITY_TYPE, TILE_TYPE, TRAIT_TYPE } from "../enums.js";
import { TypeRegistry } from "./typeRegistry.js";

const checkEnum = function(enumValues, count) {
    const seenValues = new Set();
    const missingEnums = [];
    const doubleValues = [];

    for(let i = 0; i < count; i++) {
        if(!enumValues.includes(i)) {
            missingEnums.push(i);
        }
    }

    for(const value of enumValues) {
        if(seenValues.has(value)) {
            doubleValues.push(value);
        } else {
            seenValues.add(value);
        }
    }

    return {
        "missing": missingEnums,
        "double": doubleValues
    }
}

export const validateTraitTypes = function(rTraitTypes) {
    const missingEntries = [];

    for(const traitID in rTraitTypes) {
        const index = TRAIT_TYPE[traitID];

        if(index === undefined) {
            missingEntries.push(traitID);
        }
    }

    const { missing, double } = checkEnum(Object.values(TRAIT_TYPE), TRAIT_TYPE._COUNT);

    console.log("Trait Type Report:", {
        "Missing Entries": missingEntries,
        "Missing Enums": missing,
        "Double Enums": double
    });
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