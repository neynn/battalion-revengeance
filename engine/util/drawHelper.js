import { SHAPE, TWO_PI } from "../math/constants.js";

export const drawShape = function(display, shape, color, drawX, drawY, width, height) {
    const { context } = display;

    switch(shape) {
        case SHAPE.RECTANGLE: {
            context.fillStyle = color;
            context.fillRect(drawX, drawY, width, height);
            break;
        }
        case SHAPE.CIRCLE: {
            context.fillStyle = color;
            context.beginPath();
            context.arc(drawX, drawY, width, 0, TWO_PI);
            context.fill();
            break;
        }
    }
}

export const strokeShape = function(display, shape, color, size, drawX, drawY, width, height) {
    const { context } = display;

    switch(shape) {
        case SHAPE.RECTANGLE: {
            context.strokeStyle = color;
            context.lineWidth = size;
            context.strokeRect(drawX, drawY, width, height);
            break;
        }
        case SHAPE.CIRCLE: {
            context.strokeStyle = color;
            context.lineWidth = size;
            context.beginPath();
            context.arc(drawX, drawY, width, 0, TWO_PI);
            context.stroke();
            break;
        }
    }
}

export const shadeScreen = function(display, color, alpha, width, height) {
    const { context } = display;
    const previousColor = context.fillStyle;
    const previousAlpha = context.globalAlpha;

    context.fillStyle = color;
    context.globalAlpha = alpha;
    context.fillRect(0, 0, width, height);
    context.fillStyle = previousColor;
    context.globalAlpha = previousAlpha;
}