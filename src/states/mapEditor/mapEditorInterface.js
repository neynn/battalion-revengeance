import { TILE_WIDTH } from "../../../engine/engine_constants.js";
import { getRGBAString } from "../../../engine/graphics/colorHelper.js";
import { PalletButton } from "../../../engine/map/editor/palletButton.js";
import { SHAPE } from "../../../engine/math/constants.js";
import { TileManager } from "../../../engine/tile/tileManager.js";
import { Container } from "../../../engine/ui/elements/container.js";
import { parseInterfaceByID } from "../../../engine/ui/parser.js";
import { UIContext } from "../../../engine/ui/uiContext.js";
import { ButtonWidget } from "../../../engine/ui/widgets/button.js";

export const MapEditorInterface = function() {
    UIContext.call(this);

    this.slotButtonSize = 50;
    this.textColorView = [238, 238, 238, 255];
    this.textColorEdit = [252, 252, 63, 255];
    this.textColorHide = [207, 55, 35, 255];

    this.mode = UIContext.MODE.RETAINED;
    this.camera = null;
    this.controller = null;

    this.palletButton = new ButtonWidget();
    this.palletButton.width = this.slotButtonSize;
    this.palletButton.height = this.slotButtonSize;
    this.palletButton.flags |= ButtonWidget.FLAG.DRAW_HIGHLIGHT;
    this.palletButton.flags |= ButtonWidget.FLAG.DRAW_OUTLINE;
}

MapEditorInterface.prototype = Object.create(UIContext.prototype);
MapEditorInterface.prototype.constructor = MapEditorInterface;

MapEditorInterface.prototype.load = function(gameContext) {
    const CONTAINERS = ["CONTAINER_FILE", "CONTAINER_LAYERS", "CONTAINER_TILES", "CONTAINER_TOOLS"];

    parseInterfaceByID(gameContext, this, "MAP_EDITOR");

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

MapEditorInterface.prototype.updateImmediate = function(gameContext, display) {
    const { tileManager } = gameContext;
    const { context } = display;
    const container = this.getElement("CONTAINER_TILES");
    const startY = container._screenY;
    const startX = container._screenX;
    const scale = this.slotButtonSize / TILE_WIDTH;

    const SLOT_START_Y = 100;
    const BUTTON_ROWS = 7;
    const BUTTON_COLUMNS = 7;

    context.fillStyle = "#000000";
    context.fillRect(
        startX, 
        startY + SLOT_START_Y, 
        this.slotButtonSize * BUTTON_COLUMNS, 
        this.slotButtonSize * BUTTON_ROWS
    );

    let positionY = startY + SLOT_START_Y;
    let positionX = startX;
    let index = 0;

    for(let i = 0; i < BUTTON_ROWS; i++) {
        for(let j = 0; j < BUTTON_COLUMNS; j++) {
            const palletIndex = this.controller.getPalletIndex(index);
            const tileID = this.controller.configurator.getCurrentSet().getTileID(palletIndex); 

            if(tileID !== TileManager.TILE_ID.INVALID) {
                this.camera.drawTile(tileManager, tileID, context, positionX, positionY, scale);
            }

            this.palletButton.deltaX = positionX;
            this.palletButton.deltaY = positionY;

            if(this.doButton(display, this.palletButton, index)) {
                if(tileID !== TileManager.TILE_ID.INVALID) {
                    this.controller.resetBrush();
                    this.controller.editor.setBrush(tileID, `${tileID}`);
                } else {
                    this.controller.resetBrush();
                }
            }

            positionX += this.slotButtonSize;
            index++;
        }

        positionX = startX;
        positionY += this.slotButtonSize;
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

            container.addChild(button);
            buttons.push(button);

            positionX += this.slotButtonSize;
            index++;
        }

        positionX = 0;
        positionY += this.slotButtonSize;
    }

    return buttons;
}