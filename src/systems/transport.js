import { TRANSPORT_TYPE } from "../enums.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const transportTypeToEntityType = function(transportType) {
    switch(transportType) {
        case TRANSPORT_TYPE.BARGE: return TypeRegistry.ENTITY_TYPE.LEVIATHAN_BARGE;
        case TRANSPORT_TYPE.PELICAN: return TypeRegistry.ENTITY_TYPE.PELICAN_TRANSPORT;
        case TRANSPORT_TYPE.STORK: return TypeRegistry.ENTITY_TYPE.STORK_TRANSPORT;
        default: return TypeRegistry.ENTITY_TYPE.LEVIATHAN_BARGE;
    }
}