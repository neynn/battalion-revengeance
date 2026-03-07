const MAX_COLOR_VALUE = 255;

const COLOR_TYPE = {
    NONE: 0,
    R: 1,
    RG: 2,
    RGB: 3
};

export const getRGBAString = function(r, g, b, a) {
    return `rgba(${r}, ${g}, ${b}, ${a/MAX_COLOR_VALUE})`;
}

export const getRGBAStringByArray = function(color) {
    switch(color.length) {
        case COLOR_TYPE.NONE: {
            return getRGBAString(0, 0, 0, MAX_COLOR_VALUE);
        }
        case COLOR_TYPE.R: {
            const [r] = color;
            return getRGBAString(r, 0, 0, MAX_COLOR_VALUE);
        }
        case COLOR_TYPE.RG: {
            const [r, g] = color;
            return getRGBAString(r, g, 0, MAX_COLOR_VALUE);
        }
        case COLOR_TYPE.RGB: {
            const [r, g, b] = color;
            return getRGBAString(r, g, b, MAX_COLOR_VALUE);
        }
        default: {
            const [r, g, b, a] = color;
            return getRGBAString(r, g, b, a);
        }
    }
}