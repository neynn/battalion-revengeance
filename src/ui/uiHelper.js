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