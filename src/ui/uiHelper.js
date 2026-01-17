import { GenericButton } from "./genericButton.js";

export const createGenericButton = () => {
    const button = new GenericButton(document.createElement("div"), 126, 71);

    button.addMainClass("generic_button");
    button.addImageClass("generic_button_image");
    button.addTextClass("generic_button_text");
    button.setText("GENERIC_BUTTON");
    button.load();

    return button;
}

export const placeButton = function(button, x, y) {
    button.element.style.position = "absolute";
    button.element.style.left = `${x}px`;
    button.element.style.top = `${y}px`; 
}

export const getNextX = function(button, step, padding) {
    return padding * step + button.width * (step - 1);
}

export const getNextY = function(button, step, padding) {
    return padding * step + button.height * (step - 1);
}