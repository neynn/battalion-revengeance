import { saveMap } from "../../../helpers.js";
import { State } from "../../../engine/state/state.js";
import { ArmyContext } from "../../armyContext.js";
import { EditCamera } from "../../camera/editCamera.js";
import { MapEditorController } from "../../../engine/map/editor/mapEditorController.js";
import { MapSystem } from "../../systems/map.js";
import { ArmyMapEditor } from "./armyMapEditor.js";
import { MapEditor } from "../../../engine/map/editor/mapEditor.js";
import { CameraContext } from "../../../engine/camera/cameraContext.js";

export const MapEditorState = function() {
    this.controller = null;
}

MapEditorState.prototype = Object.create(State.prototype);
MapEditorState.prototype.constructor = MapEditorState;

MapEditorState.prototype.onEnter = function(gameContext, stateMachine) {
    const { tileManager, client } = gameContext;
    const { router } = client;
    const camera = new EditCamera();
    const mapEditor = new ArmyMapEditor();
    const controller = new MapEditorController(mapEditor);

    camera.setOverlay(gameContext.resources.editorConfig.overlayColor, gameContext.resources.editorConfig.overlayAlpha);

    mapEditor.events.on(MapEditor.EVENT.BRUSH_UPDATE, (brush) => camera.onBrushUpdate(brush));
    mapEditor.events.on(MapEditor.EVENT.PALLET_UPDATE, (pallet) => console.log(pallet));

    controller.init(gameContext.resources.editorConfig, tileManager.getInversion());
    controller.buttonHandler.createButton("L1", "ground", "TEXT_L1");
    controller.buttonHandler.createButton("L2", "decoration", "TEXT_L2");
    controller.buttonHandler.createButton("L3", "cloud", "TEXT_L3");    
    controller.initUI(gameContext);
    controller.initPalletButtons(gameContext, camera);
    controller.initCursorEvents(gameContext);
    controller.updateMenuText(gameContext);

    router.bind(gameContext, "EDIT");
    router.on("TOGGLE_AUTOTILER", () => controller.toggleAutotiler(gameContext));
    router.on("TOGGLE_ERASER", () => controller.toggleEraser(gameContext));
    router.on("TOGGLE_INVERSION", () => controller.toggleInversion(gameContext));

    this.controller = controller;
    this.initCamera(gameContext, camera);
    this.initUIEvents(gameContext);

    gameContext.setGameMode(ArmyContext.GAME_MODE.EDIT);
}

MapEditorState.prototype.initCamera = function(gameContext, camera) {
    const { renderer, transform2D } = gameContext;
    const { tileWidth, tileHeight } = transform2D;
    const context = renderer.createContext(camera);
    
    context.setPosition(0, 0);
    //context.setDisplayMode(CameraContext.DISPLAY_MODE.RESOLUTION_FIXED);
    //context.setResolution(560, 560);
    //context.setPositionMode(CameraContext.POSITION_MODE.AUTO_CENTER);
    //context.setScaleMode(CameraContext.SCALE_MODE.WHOLE);

    camera.freeViewport();
    camera.setTileSize(tileWidth, tileHeight);
}

MapEditorState.prototype.onExit = function(gameContext, stateMachine) {
    const { renderer, uiManager } = gameContext;

    uiManager.destroyGUI(this.controller.guiID);
    renderer.destroyContext("CAMERA_CONTEXT");

    this.controller = null;
}

MapEditorState.prototype.initUIEvents = function(gameContext) {
    const { uiManager, world, states } = gameContext;
    const { mapManager } = world;
    const editorInterface = uiManager.getGUI(this.controller.guiID);

    editorInterface.addClick("BUTTON_INVERT", () => {
        this.controller.toggleInversion(gameContext);
    });

    editorInterface.addClick("BUTTON_BACK", () => {
        states.setNextState(gameContext, ArmyContext.STATE.MAIN_MENU);
    });

    editorInterface.addClick("BUTTON_AUTO", () => {
        this.controller.toggleAutotiler(gameContext);
    });

    editorInterface.addClick("BUTTON_TILESET_MODE", () => {
        this.controller.editor.scrollMode(1);
        this.controller.resetPage();
        this.controller.updateMenuText(gameContext);
    });

    editorInterface.addClick("BUTTON_TILESET_LEFT", () => {
        this.controller.editor.scrollBrushSet(-1);
        this.controller.resetPage();
        this.controller.updateMenuText(gameContext);
    });

    editorInterface.addClick("BUTTON_TILESET_RIGHT", () => {
        this.controller.editor.scrollBrushSet(1);
        this.controller.resetPage();
        this.controller.updateMenuText(gameContext);
    });

    editorInterface.addClick("BUTTON_PAGE_LAST", () => this.controller.updatePage(gameContext, -1)); 
    editorInterface.addClick("BUTTON_PAGE_NEXT", () => this.controller.updatePage(gameContext, 1));  
    editorInterface.addClick("BUTTON_SCROLL_SIZE", () => this.controller.updateBrushSize(gameContext, 1));
    editorInterface.addClick("BUTTON_L1", () => this.controller.clickLayerButton(gameContext, "L1"));
    editorInterface.addClick("BUTTON_L2", () => this.controller.clickLayerButton(gameContext, "L2"));
    editorInterface.addClick("BUTTON_L3", () => this.controller.clickLayerButton(gameContext, "L3"));

    editorInterface.addClick("BUTTON_SAVE", () => {
        const mapData = mapManager.getMap(this.controller.mapID);
        
        saveMap(this.controller.mapID, mapData);
    });

    editorInterface.addClick("BUTTON_CREATE", () => {
        const createNew = confirm("This will create and load a brand new map! Proceed?");

        if(createNew) {
            const mapID = `${Date.now()}`;
            const worldMap = MapSystem.createEmptyMap(gameContext, mapID, this.controller.defaultMap);

            this.controller.mapID = worldMap.getID();
        }
    });

    editorInterface.addClick("BUTTON_LOAD", async () => {
        const mapID = prompt("MAP-ID?");
        const worldMap = await MapSystem.createMapByID(gameContext, mapID);

        if(worldMap) {
            this.controller.mapID = worldMap.getID();
        }
    });

    editorInterface.addClick("BUTTON_RESIZE", () => {
        this.controller.resizeCurrentMap(gameContext);
    }); 

    editorInterface.addClick("BUTTON_UNDO", () => {
        this.controller.editor.undo(gameContext);
    }); 

    editorInterface.addClick("BUTTON_ERASER", () => {
        this.controller.toggleEraser(gameContext);
    });

    editorInterface.addClick("BUTTON_VIEW_ALL", () => {
        this.controller.viewAllLayers(gameContext);
    });
}
