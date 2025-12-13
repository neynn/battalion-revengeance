import { State } from "../../../engine/state/state.js";;
import { BattalionEditorController } from "./battalionEditorController.js";
import { createEditCamera } from "../../systems/camera.js";
import { BattalionMapEditor } from "./battalionMapEditor.js"
import { MapEditorInterface } from "./mapEditorInterface.js";

export const MapEditorState = function() {
    this.controller = null;
    this.contextID = -1;
}

MapEditorState.prototype = Object.create(State.prototype);
MapEditorState.prototype.constructor = MapEditorState;

MapEditorState.prototype.onEnter = function(gameContext, stateMachine) {
    const mapEditor = new BattalionMapEditor();
    const userInterface = new MapEditorInterface();
    const context = createEditCamera(gameContext, mapEditor.brush);
    const camera = context.getCamera();
    const controller = new BattalionEditorController(mapEditor, userInterface, camera);

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