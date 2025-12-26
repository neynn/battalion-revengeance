export const hasFlag = function(flags, flag) {
    return (flags & flag) !== 0;
}

export const setFlag = function(flags, flag) {
    return flags | flag;
}

export const clearFlag = function(flags, flag) {
    return flags & (~flag);
}

export const toggleFlag = function(flags, flag) {
    return flags ^ flag;
}