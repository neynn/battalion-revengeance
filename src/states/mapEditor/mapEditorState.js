import { State } from "../../../engine/state/state.js";;
import { EditorController } from "./editorController.js";
import { createEditCamera } from "../../systems/camera.js";
import { MapEditorInterface } from "./mapEditorInterface.js";
import { BattalionContext } from "../../battalionContext.js";
import { MapEditor } from "../../../engine/map/editor/mapEditor.js";
import { COLOR_TYPE, FACTION_TYPE, TILE_ID } from "../../enums.js";
import { BattalionMap } from "../../map/battalionMap.js";

const createMapEditor = function() {
    const editor = new MapEditor();
    const families = [
        MapEditor.generateVariantFamily(TILE_ID.ISLAND_1, TILE_ID.ISLAND_4),
        MapEditor.generateVariantFamily(TILE_ID.SWIRL_1, TILE_ID.SWIRL_4),
        MapEditor.generateVariantFamily(TILE_ID.ROCKS_1, TILE_ID.ROCKS_4),

        MapEditor.generateVariantFamily(TILE_ID.PLAINS_GROUND_1, TILE_ID.PLAINS_GROUND_8),
        MapEditor.generateVariantFamily(TILE_ID.PLAINS_SHRUB_1, TILE_ID.PLAINS_SHRUB_5),
        MapEditor.generateVariantFamily(TILE_ID.PLAINS_FOREST_1, TILE_ID.PLAINS_FOREST_4),
        MapEditor.generateVariantFamily(TILE_ID.PLAINS_MOUNTAIN_1, TILE_ID.PLAINS_MOUNTAIN_5),
        MapEditor.generateVariantFamily(TILE_ID.PLAINS_HILLS_1, TILE_ID.PLAINS_HILLS_4),

        MapEditor.generateVariantFamily(TILE_ID.BOREAL_GROUND_1, TILE_ID.BOREAL_GROUND_8),
        MapEditor.generateVariantFamily(TILE_ID.BOREAL_FOREST_1, TILE_ID.BOREAL_FOREST_4),
        MapEditor.generateVariantFamily(TILE_ID.BOREAL_MOUNTAIN_1, TILE_ID.BOREAL_MOUNTAIN_5),
        MapEditor.generateVariantFamily(TILE_ID.BOREAL_HILLS_1, TILE_ID.BOREAL_HILLS_4),

        MapEditor.generateVariantFamily(TILE_ID.ARCTIC_GROUND_1, TILE_ID.ARCTIC_GROUND_8),
        MapEditor.generateVariantFamily(TILE_ID.ARCTIC_FOREST_1, TILE_ID.ARCTIC_FOREST_4),
        MapEditor.generateVariantFamily(TILE_ID.ARCTIC_MOUNTAIN_1, TILE_ID.ARCTIC_MOUNTAIN_5),
        MapEditor.generateVariantFamily(TILE_ID.ARCTIC_HILLS_1, TILE_ID.ARCTIC_HILLS_4)
    ];

    editor.registerFill(BattalionMap.LAYER.GROUND, TILE_ID.GRASS);
    editor.initVariantTable(TILE_ID._COUNT);

    for(const family of families) {
        editor.registerVariantFamily(family);
    }

    return editor;
}

export const MapEditorState = function() {
    this.interfaceID = -1;
    this.contextID = -1;
}

MapEditorState.prototype = Object.create(State.prototype);
MapEditorState.prototype.constructor = MapEditorState;

MapEditorState.prototype.onEnter = function(gameContext, stateMachine) {
    const { states } = gameContext;
    const mapEditor = createMapEditor();
    const controller = new EditorController(mapEditor);
    const context = createEditCamera(gameContext, mapEditor.brush, controller);
    const camera = context.getCamera();
    const userInterface = new MapEditorInterface(controller, mapEditor, context.renderer);

    userInterface.load(gameContext);
    userInterface.addClickByName("BUTTON_BACK", (e) => states.setNextState(gameContext, BattalionContext.STATE.MAIN_MENU));
    userInterface.addClickByName("BUTTON_SAVE", (e) => controller.saveMap());
    userInterface.addClickByName("BUTTON_CREATE", (e) => controller.createMap(gameContext));
    userInterface.addClickByName("BUTTON_LOAD", (e) => controller.loadMap(gameContext));
    userInterface.addClickByName("BUTTON_JUMP", (e) => camera.jumpToTile(0, 0));
    userInterface.addClickByName("BUTTON_RESIZE", (e) => {
        controller.resizeCurrentMap();
        camera.jumpToTile(0, 0);
    }); 

    controller.loadArenaAssets(gameContext);
    controller.initCursorEvents(gameContext);
    controller.selectTileTab(gameContext, userInterface);

    this.interfaceID = userInterface.getID();
    this.contextID = context.getID();
}

MapEditorState.prototype.onExit = function(gameContext, stateMachine) {
    const { uiManager, contextManager } = gameContext;

    uiManager.destroyContext(this.interfaceID);
    contextManager.destroyContext(this.contextID);

    this.interfaceID = -1;
    this.contextID = -1;

    gameContext.exit();
}