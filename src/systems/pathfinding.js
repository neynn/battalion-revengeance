import { EntityHelper } from "../../engine/util/entityHelper.js";
import { hasFlag } from "../../engine/util/flag.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { PATH_FLAG, PATH_INTERCEPT } from "../enums.js";

export const mInterceptPath = function(gameContext, path, teamID) {
    let elementsToDelete = path.length;

    for(let i = path.length - 1; i >= 0; i--) {
        const { tileX, tileY } = path[i];
        const entity = EntityHelper.getTileEntity(gameContext, tileX, tileY);

        if(!entity) {
            elementsToDelete = i;
        } else if(!entity.isVisibleTo(gameContext, teamID)) {
            path.splice(0, elementsToDelete);

            if(elementsToDelete !== i + 1) {
                return PATH_INTERCEPT.ILLEGAL;
            }

            return PATH_INTERCEPT.VALID;
        }
    }

    return PATH_INTERCEPT.NONE;
}

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

    if(hasFlag(flags, PATH_FLAG.UNREACHABLE)) {
        return false;
    }

    return true;
}

export const getBestPath = function(gameContext, nodes, targetX, targetY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const path = [];

    if(!worldMap) {
        return path;
    }

    const index = worldMap.getIndex(targetX, targetY);
    const targetNode = nodes.get(index);

    if(!targetNode || !isNodeReachable(targetNode)) {
        return path;
    }

    let i = 0;
    let lastX = targetX;
    let lastY = targetY;
    let currentNode = nodes.get(targetNode.parent);

    while(currentNode !== undefined && i < BattalionEntity.MAX_MOVE_COST) {
        const { x, y, parent } = currentNode;
        const deltaX = lastX - x;
        const deltaY = lastY - y;

        path.push(createStep(deltaX, deltaY, lastX, lastY));

        i++;
        lastX = x;
        lastY = y;
        currentNode = nodes.get(parent);
    }

    return path;
}