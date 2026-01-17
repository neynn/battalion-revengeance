import { PathHandler } from "../../engine/resources/pathHandler.js";
import { GenericButton } from "./genericButton.js";

const DIRECTORY = ["assets", "gui"];

export const createGenericButton = () => {
    const div = document.createElement("div");
    const button = new GenericButton(div, null);
    const buttonSrc = PathHandler.getPath(DIRECTORY, "generic_button.png");
    const buttonHoverSrc = PathHandler.getPath(DIRECTORY, "generic_button_hovered.png");
    const buttonPressedSrc = PathHandler.getPath(DIRECTORY, "generic_button_pressed.png");

    button.image.src = buttonSrc;
    button.image.onmouseover = () => button.image.src = buttonHoverSrc;
    button.image.onmouseout = () => button.image.src = buttonSrc;
    button.image.onmousedown = () => button.image.src = buttonPressedSrc;

    button.addMainClass("generic_button");
    button.addImageClass("generic_button_image");
    button.addTextClass("generic_button_text");
    button.setText("GENERIC_BUTTON");

    return button;
}