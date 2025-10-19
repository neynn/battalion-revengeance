import { Logger } from "../logger.js";

export const ObjectPool = function(size, allocator) {
    this.allocator = allocator;
    this.originalSize = size;
    this.size = size;
    this.elements = [];
    this.openSlots = [];
    this.reservedElements = new Set();
    this.allocate();
}

ObjectPool.prototype.forAllReserved = function(onCall) {
    if(typeof onCall !== "function") {
        return;
    }

    for(const index of this.reservedElements) {
        const element = this.elements[index];

        onCall(element);
    }
}

ObjectPool.prototype.allocate = function() {
    while(this.size > this.elements.length) {
        const index = this.elements.length;
        const entry = this.allocator(index);

        this.elements.push(entry);
        this.openSlots.push(index);
    }
}

ObjectPool.prototype.freeElement = function(index) {
    if(index < 0 || index >= this.elements.length) {
        return;
    }

    if(this.reservedElements.has(index)) {
        this.reservedElements.delete(index);
        this.openSlots.push(index);
    }
}

ObjectPool.prototype.reserveElement = function() {
    if(this.openSlots.length === 0) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "ObjectPool is full!", "ObjectPool.prototype.reserveElement", null);  
        return null;
    }

    const index = this.openSlots.pop();

    this.reservedElements.add(index);

    return this.elements[index];
}

ObjectPool.prototype.isReserved = function(index) {
    return this.reservedElements.has(index);
}

ObjectPool.prototype.getReservedElement = function(index) {
    if(index < 0 || index >= this.elements.length) {
        return null;
    }

    if(!this.reservedElements.has(index)) {
        return null;
    }

    return this.elements[index];
}

ObjectPool.prototype.getElement = function(index) {
    if(index < 0 || index >= this.elements.length) {
        return null;
    }

    return this.elements[index];
}

ObjectPool.prototype.reset = function() {
    this.size = this.originalSize;
    this.elements.length = this.originalSize;
    this.reservedElements.clear();

    for(let i = 0; i < this.originalSize; i++) {
        this.openSlots[i] = i;
    }
}

ObjectPool.prototype.destroy = function() {
    this.size = 0;
    this.elements.length = 0;
    this.openSlots.length = 0;
    this.reservedElements.clear();
}