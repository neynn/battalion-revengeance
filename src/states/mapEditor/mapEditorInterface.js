import { getRGBAString } from "../../../engine/graphics/colorHelper.js";
import { PalletButton } from "../../../engine/map/editor/palletButton.js";
import { SHAPE } from "../../../engine/math/constants.js";
import { Container } from "../../../engine/ui/elements/container.js";
import { parseLayout } from "../../../engine/ui/parser.js";
import { UIContext } from "../../../engine/ui/uiContext.js";

export const MapEditorInterface = function() {
    UIContext.call(this);

    this.slotButtonSize = 50;
    this.textColorView = [238, 238, 238, 255];
    this.textColorEdit = [252, 252, 63, 255];
    this.textColorHide = [207, 55, 35, 255];
}

MapEditorInterface.prototype = Object.create(UIContext.prototype);
MapEditorInterface.prototype.constructor = MapEditorInterface;

MapEditorInterface.prototype.load = function(gameContext) {
    const CONTAINERS = ["CONTAINER_FILE", "CONTAINER_LAYERS", "CONTAINER_TILES", "CONTAINER_TOOLS"];

    parseLayout(gameContext, this, "MAP_EDITOR");

    for(const elementID of CONTAINERS) {
        const element = this.getElement(elementID);

        element.drawFlags |= Container.DRAW_FLAG.BACKGROUND;
        element.backgroundColor = getRGBAString(20, 20, 20, 128);
    }
}

MapEditorInterface.prototype.updatePermutationText = function(isEnabled) {
    const text = this.getElement("TEXT_PERMUTATION");
    const { style } = text;

    if(isEnabled) {
        style.setColorArray(this.textColorEdit);
    } else {
        style.setColorArray(this.textColorView);
    }
}

MapEditorInterface.prototype.updateInversionText = function(isInverted) {
    const text = this.getElement("TEXT_INVERT");
    const { style } = text;

    if(isInverted) {
        style.setColorArray(this.textColorEdit);
    } else {
        style.setColorArray(this.textColorView);
    }
}

MapEditorInterface.prototype.updateAutoText = function(isEnabled) {
    const text = this.getElement("TEXT_AUTO");
    const { style } = text;

    if(isEnabled) {
        style.setColorArray(this.textColorEdit);
    } else {
        style.setColorArray(this.textColorView);
        this.updateInversionText(false);
    }
}

MapEditorInterface.prototype.updateEraserText = function(isErasing) {
    const text = this.getElement("TEXT_ERASER");
    const { style } = text;

    if(isErasing) {
        style.setColorArray(this.textColorEdit);
    } else {
        style.setColorArray(this.textColorView);
    }
}

MapEditorInterface.prototype.createPalletButtons = function() {
    const buttons = [];
    const SLOT_START_Y = 100;
    const BUTTON_ROWS = 7;
    const BUTTON_COLUMNS = 7;
    let positionX = 0;
    let positionY = SLOT_START_Y;
    let index = 0;

    for(let i = 0; i < BUTTON_ROWS; i++) {
        for(let j = 0; j < BUTTON_COLUMNS; j++) {
            const button = new PalletButton(index, `BUTTON_${index}`);

            button.setShape(SHAPE.RECTANGLE);
            button.setSize(this.slotButtonSize, this.slotButtonSize);
            button.setPosition(positionX, positionY);
            button.setOrigin(positionX, positionY);
            buttons.push(button);

            positionX += this.slotButtonSize;
            index++;
        }

        positionX = 0;
        positionY += this.slotButtonSize;
    }

    return buttons;
}