import { State } from "../../../engine/state/state.js";;
import { EditorController } from "./editorController.js";
import { createEditCamera } from "../../systems/camera.js";
import { BattalionMapEditor } from "./battalionMapEditor.js"
import { MapEditorInterface } from "./mapEditorInterface.js";

export const MapEditorState = function() {
    this.interfaceID = -1;
    this.contextID = -1;
}

MapEditorState.prototype = Object.create(State.prototype);
MapEditorState.prototype.constructor = MapEditorState;

MapEditorState.prototype.onEnter = function(gameContext, stateMachine) {
    const mapEditor = new BattalionMapEditor();
    const controller = new EditorController(mapEditor);
    const context = createEditCamera(gameContext, mapEditor.brush);
    const camera = context.getCamera();
    const userInterface = new MapEditorInterface(controller, camera);

    userInterface.load(gameContext);

    controller.userInterface = userInterface;
    controller.initCursorEvents(gameContext);
    controller.initUIEvents(gameContext, camera);
    controller.initCommands(gameContext);
    controller.updateMenuText(gameContext);

    this.interfaceID = userInterface.getID();
    this.contextID = context.getID();
}

MapEditorState.prototype.onExit = function(gameContext, stateMachine) {
    const { uiManager, renderer } = gameContext;

    uiManager.destroyContext(this.interfaceID);
    renderer.destroyContext(this.contextID);

    this.interfaceID = -1;
    this.contextID = -1;

    gameContext.exit();
}