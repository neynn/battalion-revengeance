import { State } from "../../engine/state/state.js";
import { BattalionMapEditor } from "../map/battalionMapEditor.js";
import { BattalionEditorController } from "../map/battalionEditorController.js";
import { createEditCamera } from "../systems/camera.js";
import { TILE_ID } from "../enums.js";
import { MapEditorInterface } from "./mapEditor/mapEditorInterface.js";

const createMapEditor = function(gameContext) {
    const PERMUTATIONS = [
        { "origin": TILE_ID.ISLAND_1, "variants": [TILE_ID.ISLAND_2, TILE_ID.ISLAND_3, TILE_ID.ISLAND_4] }
    ];

    const SETS = [
        { "name": "BASE", "values": [TILE_ID.GRASS, TILE_ID.BOREAL, TILE_ID.ARCTIC] },
        { "name": "LAND", "values": [TILE_ID.ROAD_0, TILE_ID.VOLANO] },
        { "name": "WATER", "values": [TILE_ID.RIVER_0, TILE_ID.ROCKS_1, TILE_ID.ROCKS_2, TILE_ID.ROCKS_3, TILE_ID.ROCKS_4, TILE_ID.ISLAND_1, TILE_ID.ISLAND_2, TILE_ID.ISLAND_3, TILE_ID.ISLAND_4, TILE_ID.SWIRL_1, TILE_ID.SWIRL_2, TILE_ID.SWIRL_3, TILE_ID.SWIRL_4, TILE_ID.SHORE_0, TILE_ID.SHORE_1, TILE_ID.SHORE_2, TILE_ID.SHORE_3, TILE_ID.SHORE_4, TILE_ID.SHORE_5, TILE_ID.SHORE_6, TILE_ID.SHORE_7, TILE_ID.SHORE_8, TILE_ID.SHORE_9, TILE_ID.SHORE_10, TILE_ID.SHORE_11] }
    ];

    const BRUSH_SIZES = [
        { "width": 0, "height": 0 },
        { "width": 1, "height": 1 },
        { "width": 2, "height": 2 },
        { "width": 3, "height": 3 },
        { "width": 4, "height": 4 }
    ];

    const mapEditor = new BattalionMapEditor();

    mapEditor.loadPermutations(PERMUTATIONS);
    mapEditor.loadBrushSets(SETS);
    mapEditor.loadBrushSizes(BRUSH_SIZES);

    return mapEditor;
}

export const MapEditorState = function() {
    this.controller = null;
    this.contextID = -1;
}

MapEditorState.prototype = Object.create(State.prototype);
MapEditorState.prototype.constructor = MapEditorState;

MapEditorState.prototype.onEnter = function(gameContext, stateMachine) {
    const mapEditor = createMapEditor();
    const userInterface = new MapEditorInterface();
    const controller = new BattalionEditorController(mapEditor, userInterface);
    const context = createEditCamera(gameContext, mapEditor.brush);
    const camera = context.getCamera();

    userInterface.load(gameContext);

    const palletButtons = userInterface.createPalletButtons();

    controller.initPalletButtons(gameContext, palletButtons, camera);
    controller.initCursorEvents(gameContext);
    controller.initUIEvents(gameContext);
    controller.initCommands(gameContext);
    controller.updateMenuText();

    this.controller = controller;
    this.contextID = context.getID();
}

MapEditorState.prototype.onExit = function(gameContext, stateMachine) {
    const { uiManager, renderer } = gameContext;

    uiManager.destroyInterface(this.controller.userInterface.getID());
    renderer.destroyContext(this.contextID);

    this.controller = null;
    this.contextID = -1;

    gameContext.exit();
}