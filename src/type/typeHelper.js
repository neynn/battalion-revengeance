import { TypeRegistry } from "./typeRegistry.js";

export const TypeHelper = {
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