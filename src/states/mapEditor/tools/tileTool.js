import { MapEditor } from "../../../../engine/map/editor/mapEditor.js";
import { loopValue } from "../../../../engine/math/math.js";
import { TileManager } from "../../../../engine/tile/tileManager.js";
import { Scroller } from "../../../../engine/util/scroller.js";
import { TILE_ID } from "../../../enums.js";
import { BattalionMap } from "../../../map/battalionMap.js";
import { AssetBrowser } from "../../../../engine/map/editor/assetBrowser.js";
import { BUTTON_COUNT } from "../mapEditorInterface.js";
import { EditorTool } from "./tool.js";

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

/**
 * 
 * @param {MapEditor} mapEditor 
 */
export const TileTool = function(mapEditor) {
    EditorTool.call(this);
    
    //TODO(neyn): This is shit.
    this.userInterface = null;

    this.editor = mapEditor;
    this.brushSizes = new AssetBrowser("BRUSH_SIZES", 1, createBrushSize());
    this.tileSets = new Scroller(new AssetBrowser("INVALID", BUTTON_COUNT, TileManager.TILE_ID.INVALID));
    this.init();
}

TileTool.prototype = Object.create(EditorTool);
TileTool.prototype.constructor = TileTool;

TileTool.prototype.onUse = function(gameContext, tileX, tileY) {
    this.editor.paint(gameContext, tileX, tileY);
}

TileTool.prototype.onDisable = function(gameContext) {

}

//MAKE AN ASSET BROWSER FFS.

TileTool.prototype.onEnable = function(gameContext, userInterface) {
    const { client } = gameContext;
    const { router } = client;

    this.userInterface = userInterface;

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

    this.userInterface.addClickByName("BUTTON_INVERT", (e) => this.toggleInversion());
    this.userInterface.addClickByName("BUTTON_AUTO", (e) => this.toggleAutotiler());

    this.userInterface.addClickByName("BUTTON_TILESET_LEFT", (e) => {
        this.tileSets.loop(-1);
        this.tileSets.getValue().setPage(0);
        this.updateMenuText(gameContext);
    });

    this.userInterface.addClickByName("BUTTON_TILESET_RIGHT", (e) => {
        this.tileSets.loop(1);
        this.tileSets.getValue().setPage(0);
        this.updateMenuText(gameContext);
    });

    this.userInterface.addClickByName("BUTTON_PERMUTATION", (e) => this.togglePermutation());

    this.userInterface.addClickByName("BUTTON_PAGE_LAST", (e) => {
        this.tileSets.getValue().backward();
        this.updateMenuText(gameContext);
    }); 

    this.userInterface.addClickByName("BUTTON_PAGE_NEXT", (e) => {
        this.tileSets.getValue().forward();
        this.updateMenuText(gameContext);
    });  

    this.userInterface.addClickByName("BUTTON_SCROLL_SIZE", (e) => this.updateBrushSize(gameContext, 1));
    this.userInterface.addClickByName("BUTTON_ERASER", (e) => this.toggleEraser());

    this.updateMenuText(gameContext);
}

TileTool.prototype.onScrollDown = function(gameContext) {
    this.updateBrushSize(gameContext, -1);
}

TileTool.prototype.onScrollUp = function(gameContext) {
    this.updateBrushSize(gameContext, 1);
}

TileTool.prototype.init = function() {
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
    
    this.brushSizes.addItem(fillBrushSize(0, 0));
    this.brushSizes.addItem(fillBrushSize(1, 1));
    this.brushSizes.addItem(fillBrushSize(2, 2));
    this.brushSizes.addItem(fillBrushSize(3, 3));
    this.brushSizes.addItem(fillBrushSize(4, 4));
}

TileTool.prototype.getSizeInfo = function() {
    const { width, height } = this.brushSizes.getItem(0);
    const pageString = this.brushSizes.getPageString();
    const paintWidth = (width + 1) * 2 - 1;
    const paintHeight = (height + 1) * 2 - 1;

    return `SIZE: ${paintWidth}x${paintHeight} (${pageString})`;
}

TileTool.prototype.updateMenuText = function(gameContext) {
    const { language } = gameContext;
    const assetBrowser = this.tileSets.getValue();
    const tilesetName = language.getSystemTranslation(assetBrowser.browserID);

    this.userInterface.getElement("TEXT_PAGE").setText(this.tileSets.getValue().getPageString());
    this.userInterface.getElement("TEXT_SIZE").setText(this.getSizeInfo());
    this.userInterface.getElement("TEXT_TILESET").setText(tilesetName);
}

TileTool.prototype.updateBrushSize = function(gameContext, delta) {
    this.brushSizes.scroll(delta);

    const { width, height } = this.brushSizes.getItem(0);

    this.editor.brush.setSize(width, height);
    this.updateMenuText(gameContext);
}

TileTool.prototype.resetBrush = function() {
    this.editor.resetBrush();
    this.userInterface.updateEraserText(false);
}

TileTool.prototype.toggleAutotiler = function() {
    const isEnabled = this.editor.toggleAutotiling();

    this.userInterface.updateAutoText(isEnabled);
}

TileTool.prototype.togglePermutation = function() {
    const isEnabled = this.editor.togglePermutation();

    this.userInterface.updatePermutationText(isEnabled);
}

TileTool.prototype.toggleEraser = function() {
    const isErasing = this.editor.toggleEraser();

    this.userInterface.updateEraserText(isErasing);
}

TileTool.prototype.toggleInversion = function() {
    const isInverted = this.editor.toggleInversion();

    this.userInterface.updateInversionText(isInverted);
}