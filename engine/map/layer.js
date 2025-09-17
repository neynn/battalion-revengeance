export const Layer = function() {
    this.buffer = [];
    this.alpha = 1;
    this.autoGenerate = false;
    this.threshold = Layer.BUFFER_THRESHOLD.BIT_0;
    this.fillValue = 0;
}

Layer.BUFFER_THRESHOLD = {
    BIT_0: -1,
    BIT_8: 255,
    BIT_16: 65535,
    BIT_32: 4294967295
};

Layer.prototype.clear = function() {
    const length = this.buffer.length;
    
    for(let i = 0; i < length; ++i) {
        this.buffer[i] = 0;
    }
}

Layer.prototype.fill = function(id) {
    if(typeof id === "number" && id > 0 && id <= this.threshold) {
        const length = this.buffer.length;
        
        for(let i = 0; i < length; ++i) {
            this.buffer[i] = id;
        }

        this.fillValue = id;
    }
}

Layer.prototype.initBuffer = function(bufferSize, maxValue) {
    if(maxValue < Layer.BUFFER_THRESHOLD.BIT_8) {
        this.threshold = Layer.BUFFER_THRESHOLD.BIT_8;
        this.buffer = new Uint8Array(bufferSize);
    } else if(maxValue < Layer.BUFFER_THRESHOLD.BIT_16) {
        this.threshold = Layer.BUFFER_THRESHOLD.BIT_16;
        this.buffer = new Uint16Array(bufferSize);
    } else {
        this.threshold = Layer.BUFFER_THRESHOLD.BIT_32;
        this.buffer = new Uint32Array(bufferSize);
    }
}

Layer.prototype.setAlpha = function(alpha = 0) {
    if(alpha < 0) {
        this.alpha = 0;
    } else if(alpha > 1) {
        this.alpha = 1;
    } else {
        this.alpha = alpha;
    }
}

Layer.prototype.setAutoGenerate = function(autoGenerate) {
    this.autoGenerate = autoGenerate ?? this.autoGenerate;
}

Layer.prototype.resize = function(oldWidth, oldHeight, newWidth, newHeight) {
    const layerSize = newWidth * newHeight;
    const ArrayType = this.buffer.constructor;
    const newBuffer = new ArrayType(layerSize);
    const fill = this.fillValue;

    if(fill !== 0 && fill <= this.threshold) {
        for(let i = 0; i < layerSize; ++i) {
            newBuffer[i] = fill;
        }
    }

    const copyWidth = newWidth < oldWidth ? newWidth : oldWidth;
    const copyHeight = newHeight < oldHeight ? newHeight : oldHeight;

    for(let i = 0; i < copyHeight; ++i) {
        const newRow = i * newWidth;
        const oldRow = i * oldWidth;

        for(let j = 0; j < copyWidth; ++j) {
            const newIndex = newRow + j;
            const oldIndex = oldRow + j;

            newBuffer[newIndex] = this.buffer[oldIndex];
        }
    }

    this.buffer = newBuffer;
}

Layer.prototype.decode = function(encodedLayer) {
    if(!encodedLayer || this.buffer.length === 0) {
        return;
    }

    let i = 0;
    let index = 0;
    const MAX_INDEX = this.buffer.length;
    const LAYER_LENGTH = encodedLayer.length;

    while(index < MAX_INDEX && i < LAYER_LENGTH) {
        const typeID = encodedLayer[i++];
        const typeCount = encodedLayer[i++];
        const copies = (typeCount < MAX_INDEX - index) ? typeCount : MAX_INDEX - index;

        for(let j = 0; j < copies; ++j) {
            this.buffer[index++] = typeID;
        }
    }
}

Layer.prototype.encode = function() {
    if(this.buffer.length === 0) {
        return [];
    }

    let typeIndex = 0;
    let countIndex = 1;
    const encodedLayer = [this.buffer[0], 1];
    const bufferLength = this.buffer.length;

    for(let i = 1; i < bufferLength; ++i) {
        const currentID = this.buffer[i];

        if(currentID === encodedLayer[typeIndex]) {
            ++encodedLayer[countIndex];
        } else {
            encodedLayer.push(currentID);
            encodedLayer.push(1);
            typeIndex += 2;
            countIndex += 2;
        }
    }

    return encodedLayer;
}

Layer.prototype.getItem = function(index) {
    if(index < 0 || index >= this.buffer.length) {
        return -1;
    }

    return this.buffer[index];
}

Layer.prototype.setItem = function(item, index) {
    if(index < 0 || index >= this.buffer.length) {
        return;
    }

    this.buffer[index] = item;
}

Layer.prototype.clearItem = function(index) {
    if(index < 0 || index >= this.buffer.length) {
        return;
    }

    this.buffer[index] = 0;
}