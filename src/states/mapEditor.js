import { MapEditor } from "../../engine/map/mapEditor.js";
import { State } from "../../engine/state/state.js";
import { CameraHelper } from "../camera/cameraHelper.js";
import { BattalionMapEditor } from "../map/battalionMapEditor.js";
import { BattaltionEditorController } from "../map/battalionEditorController.js";

export const MapEditorState = function() {
    this.controller = null;
}

MapEditorState.prototype = Object.create(State.prototype);
MapEditorState.prototype.constructor = MapEditorState;

MapEditorState.prototype.onEnter = function(gameContext, stateMachine) {
    const { tileManager } = gameContext;
    const camera = CameraHelper.createEditCamera(gameContext);
    const mapEditor = new BattalionMapEditor();
    const controller = new BattaltionEditorController(mapEditor, tileManager.getInversion());

    mapEditor.events.on(MapEditor.EVENT.BRUSH_UPDATE, (brush) => camera.onBrushUpdate(brush));
    mapEditor.events.on(MapEditor.EVENT.PALLET_UPDATE, (pallet) => console.log(pallet));
 
    controller.initUI(gameContext);
    controller.initUIEvents(gameContext);
    controller.initPalletButtons(gameContext, camera);
    controller.initCursorEvents(gameContext);
    controller.updateMenuText(gameContext);
    controller.loadCommands(gameContext);

    this.controller = controller;
}

MapEditorState.prototype.onExit = function(gameContext, stateMachine) {
    const { uiManager } = gameContext;

    uiManager.destroyGUI(this.controller.guiID);
    CameraHelper.destroyEditCamera(gameContext);

    this.controller = null;
}