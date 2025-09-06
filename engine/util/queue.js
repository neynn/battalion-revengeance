export const Queue = function(size = 0) {
    this.size = size;
    this.elements = [];
    this.head = 0;
    this.tail = 0;
    this.count = 0;
    this.clearAllElements();
}

Queue.FILTER = {
    NO_SUCCESS: 0,
    SUCCESS: 1
};

Queue.prototype.clearAllElements = function() {
    for(let i = 0; i < this.size; i++) {
        this.elements[i] = null;
    }

    this.count = 0;
}

Queue.prototype.setSize = function(size = 0) {
    this.size = size;
    this.head = 0;
    this.tail = 0;
    this.clearAllElements();
}

Queue.prototype.getNext = function() {
    if(this.count === 0) {
        return null;
    }

    const element = this.elements[this.head];

    this.head = (this.head + 1) % this.size;
    this.count--;

    return element;
}

Queue.prototype.filterUntilFirstHit = function(onCheck) {
    while(this.count > 0) {
        const next = this.getNext();

        if(onCheck(next)) {
            return Queue.FILTER.SUCCESS;
        }
    }

    return Queue.FILTER.NO_SUCCESS;
}

Queue.prototype.enqueueLast = function(element) {
    if(this.isFull()) {
        return;
    }

    this.elements[this.tail] = element;
    this.tail = (this.tail + 1) % this.size;
    this.count++;
}

Queue.prototype.enqueueFirst = function(element) {
    if(this.isFull()) {
        return;
    }

    this.head = (this.head - 1 + this.size) % this.size;
    this.elements[this.head] = element;
    this.count++;
}

Queue.prototype.clear = function() {
    this.head = 0;
    this.tail = 0;
    this.clearAllElements();
}

Queue.prototype.getSize = function() {
    return this.count;
}

Queue.prototype.isFull = function() {
    return this.count >= this.size;
}

Queue.prototype.isEmpty = function() {
    return this.count === 0;
}