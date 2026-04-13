import { DIRECTION, PATH_FLAG } from "../enums.js";
import { EntityType } from "../type/parsed/entityType.js";

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

export const createStep = function(deltaX, deltaY) {
    return {
        "deltaX": deltaX,
        "deltaY": deltaY
    }
}

export const directionToStep = function(direction) {
    const step = createStep(0, 0);

    switch(direction) {
        case DIRECTION.NORTH: {
            step.deltaX = 0;
            step.deltaY = -1;
            break;
        }
        case DIRECTION.EAST: {
            step.deltaX = 1;
            step.deltaY = 0;
            break;
        }
        case DIRECTION.SOUTH: {
            step.deltaX = 0;
            step.deltaY = 1
            break;
        }
        case DIRECTION.WEST: {
            step.deltaX = -1;
            step.deltaY = 0;
            break;
        }
    }

    return step;
}

export const isNodeReachable = function(node) {
    const { flags } = node;

    if(flags & PATH_FLAG.UNREACHABLE) {
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

    while(currentNode !== undefined && i < EntityType.MAX_MOVE_COST) {
        const { x, y, parent } = currentNode;
        const deltaX = lastX - x;
        const deltaY = lastY - y;

        path.push(createStep(deltaX, deltaY));

        i++;
        lastX = x;
        lastY = y;
        currentNode = nodes.get(parent);
    }

    return path;
}