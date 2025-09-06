const MAX_COLOR_VALUE = 255;

export const getRGBAString = function(r, g, b, a) {
    return `rgba(${r}, ${g}, ${b}, ${a/MAX_COLOR_VALUE})`;
}

export const getRGBAStringByArray = function(color) {
    switch(color.length) {
        case 0: {
            return getRGBAString(0, 0, 0, MAX_COLOR_VALUE);
        }
        case 1: {
            const [r] = color;
            return getRGBAString(r, 0, 0, MAX_COLOR_VALUE);
        }
        case 2: {
            const [r, g] = color;
            return getRGBAString(r, g, 0, MAX_COLOR_VALUE);
        }
        case 3: {
            const [r, g, b] = color;
            return getRGBAString(r, g, b, MAX_COLOR_VALUE);
        }
        default: {
            const [r, g, b, a] = color;
            return getRGBAString(r, g, b, a);
        }
    }
}