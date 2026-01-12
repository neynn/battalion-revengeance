import { ENTITY_TYPE, TRANSPORT_TYPE } from "../enums.js";

export const transportTypeToEntityType = function(transportType) {
    switch(transportType) {
        case TRANSPORT_TYPE.BARGE: return ENTITY_TYPE.LEVIATHAN_BARGE;
        case TRANSPORT_TYPE.PELICAN: return ENTITY_TYPE.PELICAN_TRANSPORT;
        case TRANSPORT_TYPE.STORK: return ENTITY_TYPE.STORK_TRANSPORT;
        default: return ENTITY_TYPE.LEVIATHAN_BARGE;
    }
}