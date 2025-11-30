import { FlagHelper } from "../../engine/flagHelper.js";
import { PATH_FLAG } from "../enums.js";

export const mGetLowestCostNode = function(queue) {
    let lowestNode = queue[0];
    let lowestIndex = 0;

    for(let i = 1; i < queue.length; i++) {
        if(queue[i].cost < queue[lowestIndex].cost) {
            lowestNode = queue[i];
            lowestIndex = i;
        }
    }

    queue[lowestIndex] = queue[queue.length - 1];
    queue.pop();

    return lowestNode;
}

export const createNode = function(id, x, y, cost, type, parent, flags) {
    return {
        "id": id,
        "x": x,
        "y": y,
        "cost": cost,
        "type": type,
        "parent": parent,
        "flags": flags
    }
}

export const createStep = function(deltaX, deltaY, tileX, tileY) {
    return {
        "deltaX": deltaX,
        "deltaY": deltaY,
        "tileX": tileX,
        "tileY": tileY
    }
}

export const isNodeReachable = function(node) {
    const { flags } = node;

    if(FlagHelper.hasFlag(flags, PATH_FLAG.UNREACHABLE)) {
        return false;
    }

    return true;
}