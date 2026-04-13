import { TILE_WIDTH } from "../../../engine/engine_constants.js";
import { getRGBAString } from "../../../engine/graphics/colorHelper.js";
import { TileManager } from "../../../engine/tile/tileManager.js";
import { Container } from "../../../engine/ui/elements/container.js";
import { parseLayout } from "../../../engine/ui/parser.js";
import { IM_FLAG, UIContext } from "../../../engine/ui/uiContext.js";

export const BUTTON_ROWS = 7;
export const BUTTON_COLUMNS = 7;
export const BUTTON_COUNT = BUTTON_ROWS * BUTTON_COLUMNS;

const SLOT_START_Y = 100;
const SELECT_BUTTON_ID_REGION = 100;
const OUTLINE_COLOR = getRGBAString(255, 255, 255, 255);
const HIGHLIGHT_COLOR = getRGBAString(200, 200, 200, 64);

export const MapEditorInterface = function(controller, camera) {
    UIContext.call(this);

    this.camera = camera;
    this.controller = controller;
    this.doImmediate = true;

    this.slotButtonSize = 50;
    this.textColorView = [238, 238, 238, 255];
    this.textColorEdit = [252, 252, 63, 255];
    this.textColorHide = [207, 55, 35, 255];
}

MapEditorInterface.prototype = Object.create(UIContext.prototype);
MapEditorInterface.prototype.constructor = MapEditorInterface;

MapEditorInterface.prototype.onImmediate = function(gameContext, display) {
    const { tileManager } = gameContext;
    const { context } = display;
    const container = this.getElement("CONTAINER_TILES");
    const tileSet = this.controller.configurator.getCurrentSet();
    const pageIndex = this.controller.pageIndex;
    const scale = this.slotButtonSize / TILE_WIDTH;

    let positionX = container._screenX;
    let positionY = container._screenY + SLOT_START_Y;
    let buttonID = SELECT_BUTTON_ID_REGION;
    let index = 0;
    
    context.fillStyle = HIGHLIGHT_COLOR;
    context.strokeStyle = OUTLINE_COLOR;

    for(let i = 0; i < BUTTON_ROWS; i++) {
        for(let j = 0; j < BUTTON_COLUMNS; j++) {
            const buttonFlags = this.doButton(gameContext, buttonID, positionX, positionY, this.slotButtonSize, this.slotButtonSize);
            const palletIndex = pageIndex * BUTTON_COUNT + index;
            const tileID = tileSet.getValue(palletIndex);

            if(tileID !== TileManager.TILE_ID.INVALID) {
                this.camera.drawTile(tileManager, tileID, context, positionX, positionY, scale);

                if(buttonFlags & IM_FLAG.HOT) {
                    context.fillRect(positionX, positionY, this.slotButtonSize, this.slotButtonSize);
                }

                context.strokeRect(positionX, positionY, this.slotButtonSize, this.slotButtonSize);
            }

            if(buttonFlags & IM_FLAG.CLICKED) {
                if(tileID !== TileManager.TILE_ID.INVALID) {
                    this.controller.resetBrush();
                    this.controller.editor.setBrush(tileID, `${tileID}`);
                } else {
                    this.controller.resetBrush();
                }
            }

            positionX += this.slotButtonSize;
            buttonID++;
            index++;
        }

        positionX = container._screenX;
        positionY += this.slotButtonSize;
    }
}

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