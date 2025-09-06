export const Autotiler = function(defaultValue) {
    this.defaultValue = defaultValue;
    this.type = Autotiler.TYPE.NONE;
    this.members = new Set();
    this.values = [];
}

Autotiler.TYPE_SIZE = {
    NONE: 0,
    MIN_4: 16,
    MIN_8: 48
};

Autotiler.TYPE = {
    NONE: 0,
    MIN_4: 1,
    MIN_8: 2
};

Autotiler.TYPE_NAME = {
    MIN_4: "MIN_4",
    MIN_8: "MIN_8"
};

Autotiler.RESPONSE = {
    INVALID: 0,
    VALID: 1
};

Autotiler.SHIFTSET_8 = {
    NORTH_WEST: 0,
    NORTH: 1,
    NORTH_EAST: 2,
    WEST: 3,
    EAST: 4,
    SOUTH_WEST: 5,
    SOUTH: 6,
    SOUTH_EAST: 7
};

Autotiler.SHIFTSET_4 = {
    NORTH: 0,
    WEST: 1,
    EAST: 2,
    SOUTH: 3
};

Autotiler.VALUES_8 = {"2": 1, "8": 2, "10": 3, "11": 4, "16": 5, "18": 6, "22": 7, "24": 8, "26": 9, "27": 10, "30": 11, "31": 12, "64": 13, "66": 14, "72": 15, "74": 16, "75": 17, "80": 18, "82": 19, "86": 20, "88": 21, "90": 22, "91": 23, "94": 24, "95": 25, "104": 26, "106": 27, "107": 28, "120": 29, "122": 30, "123": 31, "126": 32, "127": 33, "208": 34, "210": 35, "214": 36, "216": 37, "218": 38, "219": 39, "222": 40, "223": 41, "248": 42, "250": 43, "251": 44, "254": 45, "255": 46, "0": 47};

Autotiler.prototype.setType = function(typeName) {
    switch(typeName) {
        case Autotiler.TYPE_NAME.MIN_4: {
            this.type = Autotiler.TYPE.MIN_4;
            this.values.length = Autotiler.TYPE_SIZE.MIN_4;
            break;
        }
        case Autotiler.TYPE_NAME.MIN_8: {
            this.type = Autotiler.TYPE.MIN_8;
            this.values.length = Autotiler.TYPE_SIZE.MIN_8;
            break;
        }
        default: {
            console.warn(`Autotiler type ${type} does not exist!`);
            this.values.length = Autotiler.TYPE_SIZE.NONE;
            break;
        }
    }

    for(let i = 0; i < this.values.length; ++i) {
         this.values[i] = this.defaultValue;
    }
}

Autotiler.prototype.setValue = function(index, value) {
    if(index < 0 || index >= this.values.length) {
        return;
    }

    this.values[index] = value;
}

Autotiler.prototype.getValue = function(index) {
    if(index < 0 || index >= this.values.length) {
        return this.defaultValue;
    }

    return this.values[index];
}

Autotiler.prototype.addMember = function(memberID) {
    this.members.add(memberID);
}

Autotiler.prototype.hasMember = function(tileID) {
    return this.members.has(tileID);
}

Autotiler.prototype.autotile4Bits = function(tileX, tileY, onCheck) {
    const { NORTH, WEST, EAST, SOUTH } = Autotiler.SHIFTSET_4;
    const north = onCheck(tileX, tileY - 1);
    const west = onCheck(tileX - 1, tileY);
    const east = onCheck(tileX + 1, tileY);
    const south = onCheck(tileX, tileY + 1);

    let total = 0b00000000;

    total |= north << NORTH;
    total |= west << WEST;
    total |= east << EAST;
    total |= south << SOUTH;

    return total;
}

Autotiler.prototype.autotile8Bits = function(tileX, tileY, onCheck) {
    const { NORTH_WEST, NORTH, NORTH_EAST, WEST, EAST, SOUTH_WEST, SOUTH, SOUTH_EAST } = Autotiler.SHIFTSET_8;
    const north = onCheck(tileX, tileY - 1);
    const west = onCheck(tileX - 1, tileY);
    const east = onCheck(tileX + 1, tileY);
    const south = onCheck(tileX, tileY + 1);

    let total = 0b00000000;

    total |= north << NORTH;
    total |= west << WEST;
    total |= east << EAST;
    total |= south << SOUTH;

    if(north) {
        if(west) {
            total |= onCheck(tileX - 1, tileY - 1) << NORTH_WEST;
        }

        if(east) {
            total |= onCheck(tileX + 1, tileY - 1) << NORTH_EAST;
        }
    }

    if(south) {
        if(west) {
            total |= onCheck(tileX - 1, tileY + 1) << SOUTH_WEST;
        }

        if(east) {
            total |= onCheck(tileX + 1, tileY + 1) << SOUTH_EAST;
        }
    }

    return total;
}

Autotiler.prototype.run = function(tileX, tileY, onCheck) {
    if(tileX === undefined || tileY === undefined || !onCheck) {
        return this.defaultValue;
    }

    switch(this.type) {
        case Autotiler.TYPE.MIN_4: {
            const index = this.autotile4Bits(tileX, tileY, onCheck);
            const tileID = this.getValue(index);

            return tileID;
        }
        case Autotiler.TYPE.MIN_8: {
            const index = this.autotile8Bits(tileX, tileY, onCheck);
            const transform = Autotiler.VALUES_8[index];
            const tileID = this.getValue(transform);

            return tileID;
        }
        default: {            
            return this.defaultValue;
        }
    }
}