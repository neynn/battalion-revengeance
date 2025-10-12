import { ActionRequest } from "../../engine/action/actionRequest.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const ActionHelper = {
    createAttackRequest: function(entityID, targetID, attackType) {
        return new ActionRequest(TypeRegistry.ACTION_TYPE.ATTACK, {
            "entityID": entityID,
            "targetID": targetID,
            "attackType": attackType
        });
    },
    createMoveRequest: function(entityID, targetX, targetY) {
        return new ActionRequest(TypeRegistry.ACTION_TYPE.MOVE, {
            "entityID": entityID,
            "targetX": targetX,
            "targetY": targetY
        });
    },
    createCloakRequest: function(entityID) {
        return new ActionRequest(TypeRegistry.ACTION_TYPE.CLOAK, {
            "entityID": entityID
        });
    }
};