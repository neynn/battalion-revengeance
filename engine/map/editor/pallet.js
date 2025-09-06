export const Pallet = function() {
    this.elements = [];
}

Pallet.ID = {
    ERROR: -1,
    ERASER: 0
};

Pallet.ERROR_ELEMENT = {
    "id": Pallet.ID.ERROR,
    "name": ""
};

Pallet.prototype.load = function(palletData) {
    this.elements.length = 0;

    for(const tileName in palletData) {
        const tileID = palletData[tileName];

        this.elements.push({
            "id": tileID,
            "name": tileName
        });
    }
}

Pallet.prototype.clear = function() {
    this.elements.length = 0;
}

Pallet.prototype.getSize = function() {
    return this.elements.length;
}

Pallet.prototype.getElement = function(index) {
    if(index < 0 || index >= this.elements.length) {
        return Pallet.ERROR_ELEMENT;
    }

    return this.elements[index];
}

Pallet.prototype.getID = function(index) {
    if(index < 0 || index >= this.elements.length) {
        return -1;
    }

    const { id } = this.elements[index];
    const value = id === undefined ? -1 : id;

    return value;
}
