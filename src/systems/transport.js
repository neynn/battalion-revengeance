import { TRANSPORT_TYPE } from "../enums.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const getTransportType = function(gameContext, transportType) {
    const { typeRegistry } = gameContext;

    switch(transportType) {
        case TRANSPORT_TYPE.BARGE: return typeRegistry.getEntityType(TypeRegistry.ENTITY_TYPE.LEVIATHAN_BARGE);
        case TRANSPORT_TYPE.PELICAN: return typeRegistry.getEntityType(TypeRegistry.ENTITY_TYPE.PELICAN_TRANSPORT);
        case TRANSPORT_TYPE.STORK: return typeRegistry.getEntityType(TypeRegistry.ENTITY_TYPE.STORK_TRANSPORT);
        default: return typeRegistry.getEntityType(TypeRegistry.ENTITY_TYPE.LEVIATHAN_BARGE);
    }
}   