export const DATA_TYPE = {
    UINT8: 0,
    UINT16: 1,
    UINT32: 2,
    INT8: 3,
    INT16: 4,
    INT32: 5,
    FLOAT16: 6,
    FLOAT32: 7,
    _COUNT: 8
};

export const TYPE_SIZE_BYTES = new Uint8Array(DATA_TYPE._COUNT);

TYPE_SIZE_BYTES[DATA_TYPE.UINT8] = 1;
TYPE_SIZE_BYTES[DATA_TYPE.UINT16] = 2;
TYPE_SIZE_BYTES[DATA_TYPE.UINT32] = 4;

TYPE_SIZE_BYTES[DATA_TYPE.INT8] = 1;
TYPE_SIZE_BYTES[DATA_TYPE.INT16] = 2;
TYPE_SIZE_BYTES[DATA_TYPE.INT32] = 4;

TYPE_SIZE_BYTES[DATA_TYPE.FLOAT16] = 2;
TYPE_SIZE_BYTES[DATA_TYPE.FLOAT32] = 4;

/**
 * 
 * @param {string} name 
 * @param {number} type 
 * @returns 
 */
export const createDataLayout = function(name, type) {
    return {
        "name": name,
        "type": type,
        "size": TYPE_SIZE_BYTES[type]
    }
}

/**
 * 
 * @param {DataView} dataView
 * @param {number} byteOffset 
 * @param {number} value 
 * @param {number} dataType 
 */
export const setViewValue = function(dataView, byteOffset, value, dataType) {
    switch(dataType) {
        case DATA_TYPE.UINT8: {
            dataView.setUint8(byteOffset, value);
            break;
        }
        case DATA_TYPE.UINT16: {
            dataView.setUint16(byteOffset, value, true);
            break;
        }
        case DATA_TYPE.UINT32: {
            dataView.setUint32(byteOffset, value, true);
            break;
        }
        case DATA_TYPE.INT8: {
            dataView.setInt8(byteOffset, value);
            break;
        }
        case DATA_TYPE.INT16: {
            dataView.setInt16(byteOffset, value, true);
            break;
        }
        case DATA_TYPE.INT32: {
            dataView.setInt32(byteOffset, value, true);
            break;
        }
        case DATA_TYPE.FLOAT16: {
            dataView.setFloat16(byteOffset, value, true);
            break;
        }
        case DATA_TYPE.FLOAT32: {
            dataView.setFloat32(byteOffset, value, true);
            break;
        }
    }
}

/**
 * 
 * @param {DataView} dataView
 * @param {number} byteOffset 
 * @param {number} dataType 
 */
export const getViewValue = function(dataView, byteOffset, dataType) {
    switch(dataType) {
        case DATA_TYPE.UINT8: return dataView.getUint8(byteOffset);
        case DATA_TYPE.UINT16: return dataView.getUint16(byteOffset, true);
        case DATA_TYPE.UINT32: return dataView.getUint32(byteOffset, true);
        case DATA_TYPE.INT8: return dataView.getInt8(byteOffset);
        case DATA_TYPE.INT16: return dataView.getInt16(byteOffset, true);
        case DATA_TYPE.INT32: return dataView.getInt32(byteOffset, true);
        case DATA_TYPE.FLOAT16: return dataView.getFloat16(byteOffset, true);
        case DATA_TYPE.FLOAT32: return dataView.getFloat32(byteOffset, true);
        default: return 0;
    }
}

export const assertMemoryLayoutSize = function(name, layout, size) {
    let count = 0;

    for(const { size } of layout) {
        count += size;
    }

    if(count !== size) {
        console.error(`MemoryLayout ${name} is invalid! Expected size: ${size}. Actual size: ${count}`);
    }
}