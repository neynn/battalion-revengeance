import { ACTION_TYPE } from "../enums.js";
import { AttackAction } from "./types/attack.js";
import { CaptureAction } from "./types/capture.js";
import { CloakAction } from "./types/cloak.js";

/*
    0x00 -> type,
    0x01 -> entityID
*/
const CLOAK_HEADER_SIZE = 3;

export const packCloakPlan = function(data) {
    const { entityID } = data;
    const buffer = new ArrayBuffer(CLOAK_HEADER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.CLOAK);
    view.setInt16(1, entityID, true);

    return buffer;
}

/*
    0x00 -> type,
    0x01 -> entityID
    0x03 -> targetX
    0x05 -> targetY
*/
const CAPTURE_HEADER_SIZE = 7;

export const packCapturePlan = function(data) {
    const { entityID, targetX, targetY } = data;
    const buffer = new ArrayBuffer(CAPTURE_HEADER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.CAPTURE);
    view.setInt16(1, entityID, true);
    view.setInt16(3, targetX, true);
    view.setInt16(5, targetY, true);

    return buffer;
}

/*
    0x00 -> type,
    0x01 -> flags,
    0x02 -> attackerID
    0x04 -> targetID
    0x06 -> resourceDamage
    0x10 -> resolutuions length
*/
const ATTACK_HEADER_SIZE = 12;
const ATTACK_RESOLUTION_SIZE = 6;

export const packAttackPlan = function(data) {
    const { attackerID, targetID, resourceDamage, flags, resolutions } = data;
    const BUFFER_SIZE = ATTACK_HEADER_SIZE + ATTACK_RESOLUTION_SIZE * resolutions.length;
    const buffer = new ArrayBuffer(BUFFER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.ATTACK);
    view.setUint8(1, flags);
    view.setInt16(2, attackerID, true);
    view.setInt16(4, targetID, true);
    view.setInt32(6, resourceDamage, true);
    view.setUint16(10, resolutions.length, true);

    let byteOffset = ATTACK_HEADER_SIZE;

    for(let i = 0; i < resolutions.length; i++) {
        const { entityID, health, delta } = resolutions[i];

        view.setInt16(byteOffset, entityID, true);
        view.setInt16(byteOffset + 2, delta, true);
        view.setUint16(byteOffset + 4, health, true);

        byteOffset += ATTACK_RESOLUTION_SIZE;
    }

    return buffer;
}

export const unpackPlan = function(data) {
    const view = new DataView(data);
    const type = view.getUint8(0);

    switch(type) {
        case ACTION_TYPE.CLOAK: {
            const plan = CloakAction.createData();

            plan.entityID = view.getInt16(1, true);

            return plan;
        }
        case ACTION_TYPE.CAPTURE: {
            const plan = CaptureAction.createData();

            plan.entityID = view.getInt16(1, true);
            plan.targetX = view.getInt16(3, true);
            plan.targetY = view.getInt16(5, true);

            return plan;
        }
        case ACTION_TYPE.ATTACK: {
            const plan = AttackAction.createData();

            plan.flags = view.getUint8(1);
            plan.attackerID = view.getInt16(2, true);
            plan.targetID = view.getInt16(4, true);
            plan.resourceDamage = view.getInt32(6, true);
            
            const length = view.getUint16(10, true);
            let byteOffset = ATTACK_HEADER_SIZE;

            for(let i = 0; i < length; i++) {
                plan.resolutions.push({
                    "entityID": view.getInt16(byteOffset, true),
                    "delta": view.getInt16(byteOffset + 2, true),
                    "health": view.getUint16(byteOffset + 4, true)
                });

                byteOffset += ATTACK_RESOLUTION_SIZE;
            }

            return plan;
        }
    }

    return null;
}