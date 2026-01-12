import { TypeRegistry } from "./typeRegistry.js";

export const validateTraits = function(gameContext) {
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

    traitCategory.checkEnums(TypeRegistry.TRAIT_TYPE);
}