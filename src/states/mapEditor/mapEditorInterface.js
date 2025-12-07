import { ColorHelper } from "../../../engine/graphics/colorHelper.js";
import { PalletButton } from "../../../engine/map/editor/palletButton.js";
import { SHAPE } from "../../../engine/math/constants.js";
import { Container } from "../../../engine/ui/elements/container.js";
import { UserInterface } from "../../../engine/ui/userInterface.js";

export const MapEditorInterface = function() {
    UserInterface.call(this);

    this.slotButtonSize = 50;
    this.textColorView = [238, 238, 238, 255];
    this.textColorEdit = [252, 252, 63, 255];
    this.textColorHide = [207, 55, 35, 255];
}

MapEditorInterface.prototype = Object.create(UserInterface.prototype);
MapEditorInterface.prototype.constructor = MapEditorInterface;

MapEditorInterface.prototype.load = function(gameContext) {
    const { uiManager } = gameContext;
    const CONTAINERS = ["CONTAINER_FILE", "CONTAINER_LAYERS", "CONTAINER_TILES", "CONTAINER_TOOLS"];

    uiManager.parseInterfaceCustom(gameContext, this, "MAP_EDITOR");

    for(const elementID of CONTAINERS) {
        const element = this.getElement(elementID);

        element.drawFlags |= Container.DRAW_FLAG.BACKGROUND;
        element.backgroundColor = ColorHelper.getRGBAString(20, 20, 20, 128);
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
    const container = this.getElement("CONTAINER_TILES");

    if(!container) {
        return buttons;
    }

    const SLOT_START_Y = 100;
    const BUTTON_ROWS = 7;
    const BUTTON_COLUMNS = 7;
    let index = 0;

    for(let i = 0; i < BUTTON_ROWS; i++) {
        const positionY = this.slotButtonSize * i + SLOT_START_Y;

        for(let j = 0; j < BUTTON_COLUMNS; j++) {
            const nextIndex = index++;
            const button = new PalletButton(nextIndex, `BUTTON_${nextIndex}`);
            const positionX = this.slotButtonSize * j;

            button.setShape(SHAPE.RECTANGLE);
            button.setSize(this.slotButtonSize, this.slotButtonSize);
            button.setPosition(positionX, positionY);
            button.setOrigin(positionX, positionY);

            container.addChild(button);
            buttons.push(button);
        }
    }

    return buttons;
}