import { State } from "../../../engine/state/state.js";;
import { EditorController } from "./editorController.js";
import { MapEditorInterface } from "./mapEditorInterface.js";
import { BattalionContext } from "../../battalionContext.js";
import { MapEditor } from "../../../engine/map/editor/mapEditor.js";
import { COLOR_TYPE, FACTION_TYPE, TILE_ID } from "../../enums.js";
import { BattalionMap } from "../../map/battalionMap.js";
import { EditRenderer2D } from "../../camera/editRenderer2D.js";
import { TILE_HEIGHT, TILE_WIDTH } from "../../../engine/engine_constants.js";
import { Cursor } from "../../../engine/client/cursor/cursor.js";

const createEditContext = function(gameContext, renderer) {
    const { contextManager } = gameContext;
    const context = contextManager.createContext();
    
    context.renderer = renderer;
    context.camera.freeViewport();
    context.camera.setTileSize(TILE_WIDTH, TILE_HEIGHT);
    
    context.setDragButton(Cursor.BUTTON.LEFT);
    context.enableBuffer();
    context.forceReload();
    context.camera.reloadViewport();

    return context;
}

export const MapEditorState = function() {
    this.mapEditor = new MapEditor();
    this.mapEditor.registerFill(BattalionMap.LAYER.GROUND, TILE_ID.GRASS);
    this.mapEditor.initVariantTable(TILE_ID._COUNT);

    this.controller = new EditorController(this.mapEditor);
    this.renderer = new EditRenderer2D(this.controller);

    this.interfaceID = -1;
    this.contextID = -1;

    this.initMapEditor();
}

MapEditorState.prototype = Object.create(State.prototype);
MapEditorState.prototype.constructor = MapEditorState;

MapEditorState.prototype.initMapEditor = function() {
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

    for(const family of families) {
        this.mapEditor.registerVariantFamily(family);
    }
}

MapEditorState.prototype.onEnter = function(gameContext, stateMachine) {
    const { states } = gameContext;
    const context = createEditContext(gameContext, this.renderer);
    const camera = context.getCamera();
    const userInterface = new MapEditorInterface(this.controller, this.mapEditor, this.renderer, camera);

    userInterface.load(gameContext);
    userInterface.addClickByName("BUTTON_BACK", (e) => states.setNextState(gameContext, BattalionContext.STATE.MAIN_MENU));
    userInterface.addClickByName("BUTTON_SAVE", (e) => this.controller.saveMap());
    userInterface.addClickByName("BUTTON_CREATE", (e) => this.controller.createMap(gameContext));
    userInterface.addClickByName("BUTTON_LOAD", (e) => this.controller.loadMap(gameContext));
    userInterface.addClickByName("BUTTON_RESIZE", (e) => {
        this.controller.resizeCurrentMap();
        camera.jumpToTile(0, 0);
    }); 

    userInterface.selectTileTool(gameContext);
    
    this.controller.loadArenaAssets(gameContext);
    this.interfaceID = userInterface.getID();
    this.contextID = context.getID();
}

MapEditorState.prototype.onExit = function(gameContext, stateMachine) {
    const { uiManager, contextManager } = gameContext;

    uiManager.destroyContext(this.interfaceID);
    contextManager.destroyContext(this.contextID);

    this.controller.removeMap();
    this.interfaceID = -1;
    this.contextID = -1;

    gameContext.exit();
}