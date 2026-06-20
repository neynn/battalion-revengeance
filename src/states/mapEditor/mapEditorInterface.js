import { getCursorTile } from "../../../engine/camera/contextHelper.js";
import { Cursor } from "../../../engine/client/cursor/cursor.js";
import { TILE_WIDTH } from "../../../engine/engine_constants.js";
import { getRGBAString } from "../../../engine/graphics/colorHelper.js";
import { TextStyle } from "../../../engine/graphics/textStyle.js";
import { AssetBrowser } from "../../../engine/map/editor/assetBrowser.js";
import { MapEditor } from "../../../engine/map/editor/mapEditor.js";
import { TileManager } from "../../../engine/tile/tileManager.js";
import { Container } from "../../../engine/ui/elements/container.js";
import { parseLayout } from "../../../engine/ui/parser.js";
import { IM_FLAG, UIContext } from "../../../engine/ui/uiContext.js";
import { Scroller } from "../../../engine/util/scroller.js";
import { TILE_ID } from "../../enums.js";
import { BattalionMap } from "../../map/battalionMap.js";
import { EditorController } from "./editorController.js";

export const BUTTON_ROWS = 7;
export const BUTTON_COLUMNS = 7;
export const BUTTON_COUNT = BUTTON_ROWS * BUTTON_COLUMNS;

const createBrushSize = function() {
    return {
        "width": 0,
        "height": 0
    }
}

const fillBrushSize = function(width, height) {
    const size = createBrushSize();

    size.width = width;
    size.height = height;

    return size;
}

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

/**
 * 
 * @param {EditorController} controller 
 * @param {*} editor 
 * @param {*} renderer 
 */
export const MapEditorInterface = function(controller, editor, renderer) {
    UIContext.call(this);

    this.controller = controller;
    this.editor = editor;
    this.renderer = renderer;
    this.doImmediate = true;

    this.textColorView = [238, 238, 238, 255];
    this.textColorEdit = [252, 252, 63, 255];
    this.textColorHide = [207, 55, 35, 255];

    this.brushSizes = new AssetBrowser("BRUSH_SIZES", 1, createBrushSize());
    this.tileSets = new Scroller(new AssetBrowser("INVALID", BUTTON_COUNT, TileManager.TILE_ID.INVALID));

    this.lastToolX = -1;
    this.lastToolY = -1;

    this.initTileSets();
    this.initBrushSizes();
}

MapEditorInterface.prototype = Object.create(UIContext.prototype);
MapEditorInterface.prototype.constructor = MapEditorInterface;

MapEditorInterface.prototype.selectTileTool = function(gameContext) {
    this.controller.selectTool(gameContext, EditorController.TAB_TYPE.TILE);
    this.enableTileTool(gameContext);
}

MapEditorInterface.prototype.toggleAutotiler = function() {
    const isEnabled = this.editor.toggleAutotiling();

    this.updateAutoText(isEnabled);
}

MapEditorInterface.prototype.toggleEraser = function() {
    const isErasing = this.editor.toggleEraser();

    this.updateEraserText(isErasing);
}

MapEditorInterface.prototype.toggleInversion = function() {
    const isInverted = this.editor.toggleInversion();

    this.updateInversionText(isInverted);
}

MapEditorInterface.prototype.togglePermutation = function() {
    const isEnabled = this.editor.togglePermutation();

    this.updatePermutationText(isEnabled);
}

MapEditorInterface.prototype.updateBrushSize = function(gameContext, delta = 0) {
    this.brushSizes.scroll(delta);

    const { width, height } = this.brushSizes.getItem(0);

    this.editor.brush.setSize(width, height);
    this.updateMenuText(gameContext);
}

MapEditorInterface.prototype.updateMenuText = function(gameContext) {
    const { language } = gameContext;
    const assetBrowser = this.tileSets.getValue();
    const tilesetName = language.getSystemTranslation(assetBrowser.browserID);

    this.getElement("TEXT_PAGE").setText(this.tileSets.getValue().getPageString());
    this.getElement("TEXT_SIZE").setText(this.getSizeInfo());
    this.getElement("TEXT_TILESET").setText(tilesetName);
}

MapEditorInterface.prototype.getSizeInfo = function() {
    const { width, height } = this.brushSizes.getItem(0);
    const pageString = this.brushSizes.getPageString();
    const paintWidth = (width + 1) * 2 - 1;
    const paintHeight = (height + 1) * 2 - 1;

    return `SIZE: ${paintWidth}x${paintHeight} (${pageString})`;
}

MapEditorInterface.prototype.resetBrush = function() {
    this.editor.resetBrush();
    this.updateEraserText(false);
}

MapEditorInterface.prototype.enableTileTool = function(gameContext) {
    const { client } = gameContext;
    const { router, cursor } = client;

    router.bind(gameContext, "EDIT");
    router.on("TOGGLE_AUTOTILER", () => this.toggleAutotiler());
    router.on("TOGGLE_ERASER", () => this.toggleEraser());
    router.on("TOGGLE_INVERSION", () => this.toggleInversion());
    router.on("TOGGLE_RANDOM", () => this.togglePermutation());
    router.on("LAYER_BOTTOM", () => this.editor.toggleLayerState(BattalionMap.LAYER.GROUND));
    router.on("LAYER_MIDDLE", () => this.editor.toggleLayerState(BattalionMap.LAYER.DECORATION));
    router.on("LAYER_TOP", () => this.editor.toggleLayerState(BattalionMap.LAYER.CLOUD));
    router.on("VIEW_ALL", () => {
        this.editor.resetLayerStates();
        this.resetBrush();
    });

    this.addClickByName("BUTTON_INVERT", (e) => this.toggleInversion());
    this.addClickByName("BUTTON_AUTO", (e) => this.toggleAutotiler());

    this.addClickByName("BUTTON_TILESET_LEFT", (e) => {
        this.tileSets.loop(-1);
        this.tileSets.getValue().setPage(0);
        this.updateMenuText(gameContext);
    });

    this.addClickByName("BUTTON_TILESET_RIGHT", (e) => {
        this.tileSets.loop(1);
        this.tileSets.getValue().setPage(0);
        this.updateMenuText(gameContext);
    });

    this.addClickByName("BUTTON_PERMUTATION", (e) => this.togglePermutation());

    this.addClickByName("BUTTON_PAGE_LAST", (e) => {
        this.tileSets.getValue().backward();
        this.updateMenuText(gameContext);
    }); 

    this.addClickByName("BUTTON_PAGE_NEXT", (e) => {
        this.tileSets.getValue().forward();
        this.updateMenuText(gameContext);
    });  

    this.addClickByName("BUTTON_SCROLL_SIZE", (e) => this.updateBrushSize(gameContext, 1));
    this.addClickByName("BUTTON_ERASER", (e) => this.toggleEraser());

    this.updateMenuText(gameContext);
}

MapEditorInterface.prototype.initTileSets = function() {
    const allSet = new AssetBrowser("MAP_EDITOR_SET_NAME_ALL", BUTTON_COUNT, TileManager.TILE_ID.INVALID);
    const canyonSet = new AssetBrowser("MAP_EDITOR_SET_NAME_CANYON", BUTTON_COUNT, TileManager.TILE_ID.INVALID);
    const transportSet = new AssetBrowser("MAP_EDITOR_SET_NAME_TRANSPORT", BUTTON_COUNT, TileManager.TILE_ID.INVALID);
    const groundSet = new AssetBrowser("MAP_EDITOR_SET_NAME_GROUND", BUTTON_COUNT, TileManager.TILE_ID.INVALID);
    const waterSet = new AssetBrowser("MAP_EDITOR_SET_NAME_WATER", BUTTON_COUNT, TileManager.TILE_ID.INVALID);
    const riverSet = new AssetBrowser("MAP_EDITOR_SET_NAME_RIVER", BUTTON_COUNT, TileManager.TILE_ID.INVALID);
    const plainsSet = new AssetBrowser("MAP_EDITOR_SET_NAME_PLAINS", BUTTON_COUNT, TileManager.TILE_ID.INVALID);

    allSet.addItemSpan(TILE_ID.GRASS, TILE_ID._COUNT - 1);

    groundSet.addItem(TILE_ID.VOLANO);
    groundSet.addItem(TILE_ID.ORE_LEFT);
    groundSet.addItem(TILE_ID.ORE_LEFT_USED);
    groundSet.addItem(TILE_ID.ORE_LEFT_DEPLETED);
    groundSet.addItem(TILE_ID.ORE_RIGHT);
    groundSet.addItem(TILE_ID.ORE_RIGHT_USED);
    groundSet.addItem(TILE_ID.ORE_RIGHT_DEPLETED);
    
    riverSet.addItemSpan(TILE_ID.RIVER_0, TILE_ID.RIVER_46); //NOT 47 because one tile does not exist!

    waterSet.addItemSpan(TILE_ID.ISLAND_1, TILE_ID.ROCKS_4);
    waterSet.addItemSpan(TILE_ID.SHORE_0, TILE_ID.SHORE_11);

    canyonSet.addItemSpan(TILE_ID.CANYON_0, TILE_ID.CANYON_47);

    transportSet.addItemSpan(TILE_ID.ROAD_0, TILE_ID.ROAD_15);
    transportSet.addItemSpan(TILE_ID.RAIL_0, TILE_ID.RAIL_15);

    plainsSet.addItemSpan(TILE_ID.PLAINS_GROUND_1, TILE_ID.PLAINS_GROUND_8);
    plainsSet.addItemSpan(TILE_ID.PLAINS_SHRUB_1, TILE_ID.PLAINS_SHRUB_5);
    plainsSet.addItemSpan(TILE_ID.PLAINS_FOREST_1, TILE_ID.PLAINS_FOREST_4);
    plainsSet.addItemSpan(TILE_ID.PLAINS_MOUNTAIN_1, TILE_ID.PLAINS_MOUNTAIN_5);

    this.tileSets.addValue(allSet);
    this.tileSets.addValue(transportSet);
    this.tileSets.addValue(canyonSet);
    this.tileSets.addValue(groundSet);
    this.tileSets.addValue(waterSet);
    this.tileSets.addValue(riverSet);
    this.tileSets.addValue(plainsSet);
}

MapEditorInterface.prototype.initBrushSizes = function() {
    this.brushSizes.addItem(fillBrushSize(0, 0));
    this.brushSizes.addItem(fillBrushSize(1, 1));
    this.brushSizes.addItem(fillBrushSize(2, 2));
    this.brushSizes.addItem(fillBrushSize(3, 3));
    this.brushSizes.addItem(fillBrushSize(4, 4));
}

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

MapEditorInterface.prototype.drawTileEditor = function(gameContext, display) {
    const { tileManager, gameWindow } = gameContext;
    const { context } = display;
    const container = this.getElement("CONTAINER_TILES");
    const assetBrowser = this.tileSets.getValue();
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
            const tileID = assetBrowser.getItem(index);

            if(tileID !== TileManager.TILE_ID.INVALID) {
                this.renderer.drawTile(tileManager, tileID, context, positionX, positionY, scale);

                if(buttonFlags & IM_FLAG.HOT) {
                    context.fillStyle = HIGHLIGHT_COLOR;
                    context.fillRect(positionX, positionY, SLOT_BUTTON_SIZE, SLOT_BUTTON_SIZE);
                }

                context.strokeRect(positionX, positionY, SLOT_BUTTON_SIZE, SLOT_BUTTON_SIZE);
            }

            if(buttonFlags & IM_FLAG.CLICKED) {
                if(tileID !== TileManager.TILE_ID.INVALID) {
                    this.resetBrush();
                    this.editor.setBrush(tileID, `${tileID}`);
                } else {
                    this.resetBrush();
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
        this.resetBrush();
    }

    this.drawLayerButton(display, bottomX, layerY, (bottomFlags & IM_FLAG.HOT), this.editor.getLayerState(BattalionMap.LAYER.GROUND), "Bottom");
    this.drawLayerButton(display, middleX, layerY, (middleFlags & IM_FLAG.HOT), this.editor.getLayerState(BattalionMap.LAYER.DECORATION), "Middle");
    this.drawLayerButton(display, topX, layerY, (topFlags & IM_FLAG.HOT), this.editor.getLayerState(BattalionMap.LAYER.CLOUD), "Top");
    this.drawLayerButton(display, allX, layerY, (allFlags & IM_FLAG.HOT), MapEditor.LAYER_STATE.VISIBLE, "View All");
}

MapEditorInterface.prototype.onImmediate = function(gameContext, display) {
    switch(this.controller.currentTab) {
        case EditorController.TAB_TYPE.NONE: {
            break;
        }
        case EditorController.TAB_TYPE.TILE: {
            this.drawTileEditor(gameContext, display);
            break;
        }
    }
}

MapEditorInterface.prototype.load = function(gameContext) {
    const { client } = gameContext;
    const { cursor } = client;

    const CONTAINERS = ["CONTAINER_FILE", "CONTAINER_TILES", "CONTAINER_TOOLS"];

    parseLayout(gameContext, this, "MAP_EDITOR");

    for(const elementID of CONTAINERS) {
        const element = this.getElement(elementID);

        element.drawFlags |= Container.DRAW_FLAG.BACKGROUND;
        element.backgroundColor = getRGBAString(20, 20, 20, 128);
    }

    cursor.events.on(Cursor.EVENT.SCROLL, ({ direction }) => {
        this.controller.scrollTool(gameContext, direction, this);
    });

    cursor.events.on(Cursor.EVENT.DRAG, ({ button }) => {
        if(button === Cursor.BUTTON.RIGHT) {
            const { x, y } = getCursorTile(gameContext);

            if(this.lastUseX !== x || this.lastUseY !== y) {
                this.lastUseX = x;
                this.lastUseY = y;
                this.controller.useTool(gameContext, x, y);
            }
        }
    });

    cursor.events.on(Cursor.EVENT.BUTTON_CLICK, ({ button }) => {
        if(button === Cursor.BUTTON.RIGHT) {
            const { x, y } = getCursorTile(gameContext);

            this.lastUseX = -1;
            this.lastUseY = -1;
            this.controller.useTool(gameContext, x, y);
        }
    });
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