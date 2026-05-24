import { BrushSet } from "../../../../engine/map/editor/brushSet.js";
import { loopValue } from "../../../../engine/math/math.js";
import { TileManager } from "../../../../engine/tile/tileManager.js";
import { Scroller } from "../../../../engine/util/scroller.js";
import { TILE_ID } from "../../../enums.js";
import { BattalionMap } from "../../../map/battalionMap.js";
import { BattalionMapEditor } from "../battalionMapEditor.js";
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
 * @param {BattalionMapEditor} mapEditor 
 */
export const TileTool = function(mapEditor) {
    EditorTool.call(this);
    
    //TODO(neyn): This is shit.
    this.userInterface = null;

    this.editor = mapEditor;
    this.pageIndex = 0;
    this.brushSizes = new Scroller(createBrushSize());
    this.tileSets = new Scroller(new BrushSet("INVALID", TileManager.TILE_ID.INVALID));
    this.init();
}

TileTool.prototype = Object.create(EditorTool);
TileTool.prototype.constructor = TileTool;

TileTool.prototype.onClick = function(gameContext, tileX, tileY) {
    this.editor.paint(gameContext, tileX, tileY);
}

TileTool.prototype.onDisable = function(gameContext) {

}

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
        this.pageIndex = 0;
        this.updateMenuText(gameContext);
    });

    this.userInterface.addClickByName("BUTTON_TILESET_RIGHT", (e) => {
        this.tileSets.loop(1);
        this.pageIndex = 0;
        this.updateMenuText(gameContext);
    });

    this.userInterface.addClickByName("BUTTON_PERMUTATION", (e) => this.togglePermutation());
    this.userInterface.addClickByName("BUTTON_PAGE_LAST", (e) => this.updatePage(gameContext, -1)); 
    this.userInterface.addClickByName("BUTTON_PAGE_NEXT", (e) => this.updatePage(gameContext, 1));  
    this.userInterface.addClickByName("BUTTON_SCROLL_SIZE", (e) => this.updateBrushSize(gameContext, 1));
    this.userInterface.addClickByName("BUTTON_UNDO", (e) => this.editor.undo(gameContext)); 
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
    const allSet = new BrushSet("MAP_EDITOR_SET_NAME_ALL", TileManager.TILE_ID.INVALID);
    const canyonSet = new BrushSet("MAP_EDITOR_SET_NAME_CANYON", TileManager.TILE_ID.INVALID);
    const transportSet = new BrushSet("MAP_EDITOR_SET_NAME_TRANSPORT", TileManager.TILE_ID.INVALID);
    const groundSet = new BrushSet("MAP_EDITOR_SET_NAME_GROUND", TileManager.TILE_ID.INVALID);
    const waterSet = new BrushSet("MAP_EDITOR_SET_NAME_WATER", TileManager.TILE_ID.INVALID);
    const riverSet = new BrushSet("MAP_EDITOR_SET_NAME_RIVER", TileManager.TILE_ID.INVALID);
    const plainsSet = new BrushSet("MAP_EDITOR_SET_NAME_PLAINS", TileManager.TILE_ID.INVALID);

    allSet.addValues(TILE_ID.GRASS, TILE_ID._COUNT - 1);

    groundSet.addValue(TILE_ID.VOLANO);
    groundSet.addValue(TILE_ID.ORE_LEFT);
    groundSet.addValue(TILE_ID.ORE_LEFT_USED);
    groundSet.addValue(TILE_ID.ORE_LEFT_DEPLETED);
    groundSet.addValue(TILE_ID.ORE_RIGHT);
    groundSet.addValue(TILE_ID.ORE_RIGHT_USED);
    groundSet.addValue(TILE_ID.ORE_RIGHT_DEPLETED);
    
    riverSet.addValues(TILE_ID.RIVER_0, TILE_ID.RIVER_46); //NOT 47 because one tile does not exist!

    waterSet.addValues(TILE_ID.ISLAND_1, TILE_ID.ROCKS_4);
    waterSet.addValues(TILE_ID.SHORE_0, TILE_ID.SHORE_11);

    canyonSet.addValues(TILE_ID.CANYON_0, TILE_ID.CANYON_47);

    transportSet.addValues(TILE_ID.ROAD_0, TILE_ID.ROAD_15);
    transportSet.addValues(TILE_ID.RAIL_0, TILE_ID.RAIL_15);

    plainsSet.addValues(TILE_ID.PLAINS_GROUND_1, TILE_ID.PLAINS_GROUND_8);
    plainsSet.addValues(TILE_ID.PLAINS_SHRUB_1, TILE_ID.PLAINS_SHRUB_5);
    plainsSet.addValues(TILE_ID.PLAINS_FOREST_1, TILE_ID.PLAINS_FOREST_4);
    plainsSet.addValues(TILE_ID.PLAINS_MOUNTAIN_1, TILE_ID.PLAINS_MOUNTAIN_5);

    this.tileSets.addValue(allSet);
    this.tileSets.addValue(transportSet);
    this.tileSets.addValue(canyonSet);
    this.tileSets.addValue(groundSet);
    this.tileSets.addValue(waterSet);
    this.tileSets.addValue(riverSet);
    this.tileSets.addValue(plainsSet);
    
    this.brushSizes.addValue(fillBrushSize(0, 0));
    this.brushSizes.addValue(fillBrushSize(1, 1));
    this.brushSizes.addValue(fillBrushSize(2, 2));
    this.brushSizes.addValue(fillBrushSize(3, 3));
    this.brushSizes.addValue(fillBrushSize(4, 4));
}

TileTool.prototype.getSizeInfo = function() {
    const { width, height } = this.brushSizes.getValue();
    const pageString = this.brushSizes.getPageString();
    const paintWidth = (width + 1) * 2 - 1;
    const paintHeight = (height + 1) * 2 - 1;

    return `SIZE: ${paintWidth}x${paintHeight} (${pageString})`;
}

TileTool.prototype.getPageText = function() {
    const palletSize = this.tileSets.getValue().getSize();
    const maxPagesNeeded = Math.ceil(palletSize / BUTTON_COUNT);
    const showMaxPagesNeeded = maxPagesNeeded === 0 ? 1 : maxPagesNeeded;
    const showCurrentPage = this.pageIndex + 1;

    return `${showCurrentPage} / ${showMaxPagesNeeded}`;
}

TileTool.prototype.updateMenuText = function(gameContext) {
    const { language } = gameContext;
    const nameID = this.tileSets.getValue().name;
    const tilesetName = language.getSystemTranslation(nameID);

    this.userInterface.getElement("TEXT_PAGE").setText(this.getPageText());
    this.userInterface.getElement("TEXT_SIZE").setText(this.getSizeInfo());
    this.userInterface.getElement("TEXT_TILESET").setText(tilesetName);
}

TileTool.prototype.updateBrushSize = function(gameContext, delta) {
    const { width, height } = this.brushSizes.scroll(delta);

    this.editor.brush.setSize(width, height);
    this.updateMenuText(gameContext);
}

TileTool.prototype.updatePage = function(gameContext, delta) {
    const palletSize = this.tileSets.getValue().getSize();
    const maxPagesNeeded = Math.ceil(palletSize / BUTTON_COUNT);

    if(maxPagesNeeded <= 0) {
        this.pageIndex = 0;
    } else {
        this.pageIndex = loopValue(this.pageIndex + delta, maxPagesNeeded - 1, 0);
    }

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