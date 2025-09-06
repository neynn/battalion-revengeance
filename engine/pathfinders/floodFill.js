export const FloodFill = function(straightCost, crossCost) {
    this.straightCost = straightCost;
    this.crossCost = crossCost;
}

FloodFill.RESPONSE = {
    IGNORE_NEXT: 0,
    USE_NEXT: 1
};

FloodFill.STRAIGHT = {
    UP: 1 << 0,
    RIGHT: 1 << 1,
    DOWN: 1 << 2,
    LEFT: 1 << 3
};

FloodFill.CROSS = {
    UP_LEFT: FloodFill.STRAIGHT.UP | FloodFill.STRAIGHT.LEFT,
    UP_RIGHT: FloodFill.STRAIGHT.UP | FloodFill.STRAIGHT.RIGHT,
    DOWN_LEFT: FloodFill.STRAIGHT.DOWN | FloodFill.STRAIGHT.LEFT,
    DOWN_RIGHT: FloodFill.STRAIGHT.DOWN | FloodFill.STRAIGHT.RIGHT
};

FloodFill.createNode = function(positionX, positionY, cost, type, parent) {
    return {
        "positionX": positionX,
        "positionY": positionY,
        "cost": cost,
        "type": type,
        "parent": parent
    }
}

FloodFill.isNodeInBounds = function(positionX, positionY, mapWidth, mapHeight) {
    return positionX >= 0 && positionY >= 0 && positionX < mapWidth && positionY < mapHeight;
}

FloodFill.getNeighbors = function(positionX, positionY) {
    return [
        positionX, positionY - 1, FloodFill.STRAIGHT.UP,
        positionX + 1, positionY, FloodFill.STRAIGHT.RIGHT,
        positionX, positionY + 1, FloodFill.STRAIGHT.DOWN,
        positionX - 1, positionY, FloodFill.STRAIGHT.LEFT
    ]
}

FloodFill.getCrossNeighbors = function(positionX, positionY) {
    return [
        positionX - 1, positionY - 1, FloodFill.CROSS.UP_LEFT,
        positionX + 1, positionY - 1, FloodFill.CROSS.UP_RIGHT,
        positionX - 1, positionY + 1, FloodFill.CROSS.DOWN_LEFT,
        positionX + 1, positionY + 1, FloodFill.CROSS.DOWN_RIGHT
    ]
}

FloodFill.flattenTree = function(startNode) {
    const nodeStack = [startNode];
    const walkedNodes = [];

    while(nodeStack.length !== 0) {
        const node = nodeStack.pop();
        const { parent } = node;

        walkedNodes.push(node);

        if(parent === null) {
            break;
        }

        nodeStack.push(parent);
    }

    return walkedNodes;
}

FloodFill.prototype.search = function(startX, startY, gLimit, mapWidth, mapHeight, onCheck) {
    const queue = [];
    const visitedNodes = new Set();

    const startNode = FloodFill.createNode(startX, startY, 0, null, null);
    const startID = startY * mapWidth + startX;

    let index = 0;

    queue.push(startNode);
    visitedNodes.add(startID);

    while(index < queue.length) {
        const node = queue[index++];
        const { cost, positionX, positionY } = node;

        if(cost >= gLimit) {
            continue;
        }

        const neighborCost = cost + this.straightCost;
        const neighbors = FloodFill.getNeighbors(positionX, positionY);

        for(let i = 0; i < neighbors.length; i += 3) {
            const x = neighbors[i];
            const y = neighbors[i + 1];
            const type = neighbors[i + 2];
            const neighborID = y * mapWidth + x;

            if(!visitedNodes.has(neighborID) && FloodFill.isNodeInBounds(x, y, mapWidth, mapHeight)) {
                const childNode = FloodFill.createNode(x, y, neighborCost, type, node);

                if(onCheck(childNode) === FloodFill.RESPONSE.USE_NEXT) {
                    queue.push(childNode);
                }

                visitedNodes.add(neighborID);
            }
        }
    }
}

FloodFill.prototype.searchCross = function(startX, startY, gLimit, mapWidth, mapHeight, onCheck) {
    const queue = [];
    const visitedNodes = new Set();

    const startNode = FloodFill.createNode(startX, startY, 0, null, null);
    const startID = startY * mapWidth + startX;

    let index = 0;

    queue.push(startNode);
    visitedNodes.add(startID);

    while(index < queue.length) {
        const node = queue[index++];
        const { cost, positionX, positionY } = node;

        if(cost >= gLimit) {
            continue;
        }

        let validStraights = 0b00000000;

        const neighborCost = cost + this.straightCost;
        const neighbors = FloodFill.getNeighbors(positionX, positionY);

        for(let i = 0; i < neighbors.length; i += 3) {
            const x = neighbors[i];
            const y = neighbors[i + 1];
            const type = neighbors[i + 2];
            const neighborID = y * mapWidth + x;

            if(!visitedNodes.has(neighborID) && FloodFill.isNodeInBounds(x, y, mapWidth, mapHeight)) {
                const childNode = FloodFill.createNode(x, y, neighborCost, type, node);

                if(onCheck(childNode) === FloodFill.RESPONSE.USE_NEXT) {
                    queue.push(childNode);

                    if(neighborCost <= gLimit) {
                        validStraights |= type;
                    }
                }

                visitedNodes.add(neighborID);
            }
        }

        const crossNeighborCost = cost + this.crossCost;
        const crossNeighbors = FloodFill.getCrossNeighbors(positionX, positionY);

        for(let i = 0; i < crossNeighbors.length; i += 3) {
            const x = crossNeighbors[i];
            const y = crossNeighbors[i + 1];
            const type = crossNeighbors[i + 2];

            if((validStraights & type) !== type) {
                continue;
            }

            const neighborID = y * mapWidth + x;

            if(!visitedNodes.has(neighborID) && FloodFill.isNodeInBounds(x, y, mapWidth, mapHeight)) {
                const childNode = FloodFill.createNode(x, y, crossNeighborCost, type, node);

                if(onCheck(childNode) === FloodFill.RESPONSE.USE_NEXT) {
                    queue.push(childNode);
                }

                visitedNodes.add(neighborID);
            }
        }
    }
}