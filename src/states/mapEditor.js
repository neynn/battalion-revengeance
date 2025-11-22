import { MapEditor } from "../../engine/map/editor/mapEditor.js";
import { State } from "../../engine/state/state.js";
import { CameraHelper } from "../camera/cameraHelper.js";
import { BattalionMapEditor } from "../map/battalionMapEditor.js";
import { BattalionEditorController } from "../map/battalionEditorController.js";

export const MapEditorState = function() {
    this.controller = null;
    this.contextID = -1;
}

MapEditorState.prototype = Object.create(State.prototype);
MapEditorState.prototype.constructor = MapEditorState;

MapEditorState.prototype.onEnter = function(gameContext, stateMachine) {
    const { tileManager } = gameContext;
    const context = CameraHelper.createEditCamera(gameContext);
    const camera = context.getCamera();
    const mapEditor = new BattalionMapEditor();
    const controller = new BattalionEditorController(mapEditor);
    const hiddenSets = [];

    mapEditor.initBrushSets(tileManager.getInversion(), hiddenSets);
    mapEditor.events.on(MapEditor.EVENT.BRUSH_UPDATE, ({ brush }) => camera.onBrushUpdate(brush));
    mapEditor.events.on(MapEditor.EVENT.PALLET_UPDATE, ({ pallet }) => console.log(pallet));
 
    controller.initUI(gameContext);
    controller.initUIEvents(gameContext);
    controller.initPalletButtons(gameContext, camera);
    controller.initCursorEvents(gameContext);
    controller.updateMenuText(gameContext);
    controller.loadCommands(gameContext);

    this.controller = controller;
    this.contextID = context.getID();
}

MapEditorState.prototype.onExit = function(gameContext, stateMachine) {
    const { uiManager, renderer } = gameContext;

    uiManager.destroyGUI(this.controller.guiID);
    renderer.destroyContext(this.contextID);

    this.controller = null;
    this.contextID = -1;

    gameContext.exit();
}