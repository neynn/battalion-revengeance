import { TypeRegistry } from "./typeRegistry.js";

export const TypeHelper = {
    getTerrainTags: function(gameContext, tileID) {
        const { typeRegistry } = gameContext;
        const type = typeRegistry.getType(tileID, TypeRegistry.CATEGORY.TILE);
        const tags = [];

        if(type) {
            const { terrain } = type;

            if(terrain) {
                for(let i = 0; i < terrain.length; i++) {
                    tags.push(terrain[i]);
                }
            }
        }

        return tags;
    },
    getClimateType: function(gameContext, tileID) {
        const { typeRegistry } = gameContext;
        const type = typeRegistry.getType(tileID, TypeRegistry.CATEGORY.TILE);

        if(type) {
            const { climate = TypeRegistry.CLIMATE_TYPE.NONE } = type;

            return climate;
        }

        return TypeRegistry.CLIMATE_TYPE.NONE;
    }
}