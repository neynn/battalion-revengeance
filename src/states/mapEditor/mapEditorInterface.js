import { TILE_WIDTH } from "../../../engine/engine_constants.js";
import { getRGBAString } from "../../../engine/graphics/colorHelper.js";
import { TextStyle } from "../../../engine/graphics/textStyle.js";
import { MapEditor } from "../../../engine/map/editor/mapEditor.js";
import { TileManager } from "../../../engine/tile/tileManager.js";
import { Container } from "../../../engine/ui/elements/container.js";
import { parseLayout } from "../../../engine/ui/parser.js";
import { IM_FLAG, UIContext } from "../../../engine/ui/uiContext.js";
import { BattalionMap } from "../../map/battalionMap.js";
import { EditorController } from "./editorController.js";

export const BUTTON_ROWS = 7;
export const BUTTON_COLUMNS = 7;
export const BUTTON_COUNT = BUTTON_ROWS * BUTTON_COLUMNS;

const SLOT_START_Y = 100;
const SLOT_BUTTON_SIZE = 50;
const SLOT_BUTTON_ID_REGION = 100;

const LAYER_BUTTON_WIDTH = 100;
const LAYER_BUTTON_HEIGHT = 50;
const LAYER_BUTTON_ID_REGION = 200;

const OUTLINE_COLOR = getRGBAString(255, 255, 255, 255);
const HIGHLIGHT_COLOR = getRGBAString(200, 200, 200, 64);
const BACKGROUND_COLOR = getRGBAString(20, 20, 20, 128);

const TEXT_COLOR_VIEW = getRGBAString(238, 238, 238, 255);
const TEXT_COLOR_EDIT = getRGBAString(252, 252, 63, 255);
const TEXT_COLOR_HIDE = getRGBAString(207, 55, 35, 255);

export const MapEditorInterface = function(controller, editor, camera) {
    UIContext.call(this);

    this.controller = controller;
    this.editor = editor;
    this.camera = camera;
    this.doImmediate = true;

    this.textColorView = [238, 238, 238, 255];
    this.textColorEdit = [252, 252, 63, 255];
    this.textColorHide = [207, 55, 35, 255];
}

MapEditorInterface.prototype = Object.create(UIContext.prototype);
MapEditorInterface.prototype.constructor = MapEditorInterface;

MapEditorInterface.prototype.drawLayerButton = function(display, buttonX, buttonY, isHot, state, text) {
    const { context } = display;
    const textX = buttonX + LAYER_BUTTON_WIDTH / 2;
    const textY = buttonY + LAYER_BUTTON_HEIGHT / 2;

    context.fillStyle = BACKGROUND_COLOR;
    context.fillRect(buttonX, buttonY, LAYER_BUTTON_WIDTH, LAYER_BUTTON_HEIGHT);

    switch(state) {
        case MapEditor.LAYER_STATE.HIDDEN: {
            context.fillStyle = TEXT_COLOR_HIDE;
            break;
        }
        case MapEditor.LAYER_STATE.VISIBLE: {
            context.fillStyle = TEXT_COLOR_VIEW;
            break;
        }
        case MapEditor.LAYER_STATE.EDIT: {
            context.fillStyle = TEXT_COLOR_EDIT;
            break;
        }
    }

    context.font = "20px Arial";
    context.textAlign = TextStyle.ALIGN.MIDDLE;
    context.fillText(text, textX, textY);

    if(isHot) {
        context.fillStyle = HIGHLIGHT_COLOR;
        context.fillRect(buttonX, buttonY, LAYER_BUTTON_WIDTH, LAYER_BUTTON_HEIGHT);
    }

    context.strokeStyle = OUTLINE_COLOR;
    context.strokeRect(buttonX, buttonY, LAYER_BUTTON_WIDTH, LAYER_BUTTON_HEIGHT);
}

MapEditorInterface.prototype.drawTileEditor = function(gameContext, display, tool) {
    const { tileManager, gameWindow } = gameContext;
    const { context } = display;
    const container = this.getElement("CONTAINER_TILES");
    const tileSet = tool.tileSets.getValue();
    const pageIndex = tool.pageIndex;
    const scale = SLOT_BUTTON_SIZE / TILE_WIDTH;

    let positionX = container._screenX;
    let positionY = container._screenY + SLOT_START_Y;
    let buttonID = SLOT_BUTTON_ID_REGION;
    let index = 0;
    
    context.fillStyle = HIGHLIGHT_COLOR;
    context.strokeStyle = OUTLINE_COLOR;

    for(let i = 0; i < BUTTON_ROWS; i++) {
        for(let j = 0; j < BUTTON_COLUMNS; j++) {
            const buttonFlags = this.doButton(gameContext, buttonID, positionX, positionY, SLOT_BUTTON_SIZE, SLOT_BUTTON_SIZE);
            const palletIndex = pageIndex * BUTTON_COUNT + index;
            const tileID = tileSet.getValue(palletIndex);

            if(tileID !== TileManager.TILE_ID.INVALID) {
                this.camera.drawTile(tileManager, tileID, context, positionX, positionY, scale);

                if(buttonFlags & IM_FLAG.HOT) {
                    context.fillRect(positionX, positionY, SLOT_BUTTON_SIZE, SLOT_BUTTON_SIZE);
                }

                context.strokeRect(positionX, positionY, SLOT_BUTTON_SIZE, SLOT_BUTTON_SIZE);
            }

            if(buttonFlags & IM_FLAG.CLICKED) {
                if(tileID !== TileManager.TILE_ID.INVALID) {
                    tool.resetBrush();
                    this.editor.setBrush(tileID, `${tileID}`);
                } else {
                    tool.resetBrush();
                }
            }

            positionX += SLOT_BUTTON_SIZE;
            buttonID++;
            index++;
        }

        positionX = container._screenX;
        positionY += SLOT_BUTTON_SIZE;
    }

    const layerX = 0;
    const layerY = gameWindow.height - LAYER_BUTTON_HEIGHT;

    const bottomX = layerX;
    const bottomID = LAYER_BUTTON_ID_REGION;
    const bottomFlags = this.doButton(gameContext, bottomID, bottomX, layerY, LAYER_BUTTON_WIDTH, LAYER_BUTTON_HEIGHT);

    const middleX = bottomX + LAYER_BUTTON_WIDTH;
    const middleID = LAYER_BUTTON_ID_REGION + 1;
    const middleFlags = this.doButton(gameContext, middleID, middleX, layerY, LAYER_BUTTON_WIDTH, LAYER_BUTTON_HEIGHT);

    const topX = middleX + LAYER_BUTTON_WIDTH;
    const topID = LAYER_BUTTON_ID_REGION + 2;
    const topFlags = this.doButton(gameContext, topID, topX, layerY, LAYER_BUTTON_WIDTH, LAYER_BUTTON_HEIGHT);

    const allX = topX + LAYER_BUTTON_WIDTH;
    const allID = LAYER_BUTTON_ID_REGION + 3;
    const allFlags = this.doButton(gameContext, allID, allX, layerY, LAYER_BUTTON_WIDTH, LAYER_BUTTON_HEIGHT);

    if(bottomFlags & IM_FLAG.CLICKED) {
        this.editor.toggleLayerState(BattalionMap.LAYER.GROUND);
    }

    if(middleFlags & IM_FLAG.CLICKED) {
        this.editor.toggleLayerState(BattalionMap.LAYER.DECORATION);
    }

    if(topFlags & IM_FLAG.CLICKED) {
        this.editor.toggleLayerState(BattalionMap.LAYER.CLOUD);
    }

    if(allFlags & IM_FLAG.CLICKED) {
        this.editor.resetLayerStates();
        tool.resetBrush();
    }

    this.drawLayerButton(display, bottomX, layerY, (bottomFlags & IM_FLAG.HOT), this.editor.getLayerState(BattalionMap.LAYER.GROUND), "Bottom");
    this.drawLayerButton(display, middleX, layerY, (middleFlags & IM_FLAG.HOT), this.editor.getLayerState(BattalionMap.LAYER.DECORATION), "Middle");
    this.drawLayerButton(display, topX, layerY, (topFlags & IM_FLAG.HOT), this.editor.getLayerState(BattalionMap.LAYER.CLOUD), "Top");
    this.drawLayerButton(display, allX, layerY, (allFlags & IM_FLAG.HOT), MapEditor.LAYER_STATE.VISIBLE, "View All");
}

MapEditorInterface.prototype.onImmediate = function(gameContext, display) {
    switch(this.controller.tool) {
        case EditorController.TOOL.NONE: {
            break;
        }
        case EditorController.TOOL.TILE: {
            this.drawTileEditor(gameContext, display, this.controller.tools[EditorController.TOOL.TILE]);
            break;
        }
    }
}

MapEditorInterface.prototype.load = function(gameContext) {
    const CONTAINERS = ["CONTAINER_FILE", "CONTAINER_TILES", "CONTAINER_TOOLS"];

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