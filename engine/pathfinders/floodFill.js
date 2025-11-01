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

FloodFill.NEIGHBORS = [
    [0, -1, FloodFill.STRAIGHT.UP],
    [1, 0, FloodFill.STRAIGHT.RIGHT],
    [0, 1, FloodFill.STRAIGHT.DOWN],
    [-1, 0, FloodFill.STRAIGHT.LEFT]
];

FloodFill.CROSS_NEIGHBORS = [
    [-1, -1, FloodFill.CROSS.UP_LEFT],
    [1, -1, FloodFill.CROSS.UP_RIGHT],
    [-1, 1, FloodFill.CROSS.DOWN_LEFT],
    [1, 1, FloodFill.CROSS.DOWN_RIGHT]
];

FloodFill.ALL_NEIGHBORS = [
    [0, -1, FloodFill.STRAIGHT.UP],
    [1, 0, FloodFill.STRAIGHT.RIGHT],
    [0, 1, FloodFill.STRAIGHT.DOWN],
    [-1, 0, FloodFill.STRAIGHT.LEFT],
    [-1, -1, FloodFill.CROSS.UP_LEFT],
    [1, -1, FloodFill.CROSS.UP_RIGHT],
    [-1, 1, FloodFill.CROSS.DOWN_LEFT],
    [1, 1, FloodFill.CROSS.DOWN_RIGHT]
];

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

FloodFill.fill2D = function(startX, startY, mapWidth, mapHeight, range, onFill) {
    const queue = [];
    const visited = new Set();
    let index = 0;

    visited.add(startY * mapWidth + startX);
    queue.push({ "x": startX, "y": startY, "cost": 0 });

    if(FloodFill.isNodeInBounds(startX, startY, mapWidth, mapHeight)) {
        onFill(startX, startY);
    }

    while(index < queue.length) {
        const { x, y, cost } = queue[index++];
        const neighborCost = cost + 1;

        if(neighborCost > range) {
            continue;
        }

        for(let i = 0; i < FloodFill.NEIGHBORS.length; i++) {
            const [deltaX, deltaY] = FloodFill.NEIGHBORS[i];
            const neighborX = x + deltaX;
            const neighborY = y + deltaY;
            const neighborID = neighborY * mapWidth + neighborX;

            if(!visited.has(neighborID) && FloodFill.isNodeInBounds(neighborX, neighborY, mapWidth, mapHeight)) {
                onFill(neighborX, neighborY);
                visited.add(neighborID);
                queue.push({ "x": neighborX, "y": neighborY, "cost": neighborCost });
            } 
        }
    }
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

        for(let i = 0; i < FloodFill.NEIGHBORS.length; i++) {
            const [deltaX, deltaY, type] = FloodFill.NEIGHBORS[i];
            const x = positionX + deltaX;
            const y = positionY + deltaY;
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
        const crossNeighborCost = cost + this.crossCost;

        for(let i = 0; i < FloodFill.NEIGHBORS.length; i++) {
            const [deltaX, deltaY, type] = FloodFill.NEIGHBORS[i];
            const x = positionX + deltaX;
            const y = positionY + deltaY;
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

        for(let i = 0; i < FloodFill.CROSS_NEIGHBORS.length; i++) {
            const [deltaX, deltaY, type] = FloodFill.CROSS_NEIGHBORS[i];
            const x = positionX + deltaX;
            const y = positionY + deltaY;

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