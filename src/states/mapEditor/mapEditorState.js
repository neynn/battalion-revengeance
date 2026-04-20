import { State } from "../../../engine/state/state.js";;
import { EditorController } from "./editorController.js";
import { createEditCamera } from "../../systems/camera.js";
import { BattalionMapEditor } from "./battalionMapEditor.js"
import { MapEditorInterface } from "./mapEditorInterface.js";
import { BattalionContext } from "../../battalionContext.js";

export const MapEditorState = function() {
    this.interfaceID = -1;
    this.contextID = -1;
}

MapEditorState.prototype = Object.create(State.prototype);
MapEditorState.prototype.constructor = MapEditorState;

MapEditorState.prototype.onEnter = function(gameContext, stateMachine) {
    const { states } = gameContext;
    const mapEditor = new BattalionMapEditor();
    const controller = new EditorController(mapEditor);
    const context = createEditCamera(gameContext, mapEditor.brush);
    const camera = context.getCamera();
    const userInterface = new MapEditorInterface(controller, mapEditor, camera);

    userInterface.load(gameContext);
    userInterface.addClickByName("BUTTON_BACK", (e) => states.setNextState(gameContext, BattalionContext.STATE.MAIN_MENU));
    userInterface.addClickByName("BUTTON_SAVE", (e) => controller.saveMap());
    userInterface.addClickByName("BUTTON_CREATE", (e) => controller.createMap(gameContext));
    userInterface.addClickByName("BUTTON_LOAD", (e) => controller.loadMap(gameContext));
    userInterface.addClickByName("BUTTON_RESIZE", (e) => {
        controller.resizeCurrentMap();
        camera.jumpToTile(0, 0);
    }); 

    controller.initCursorEvents(gameContext);
    controller.selectTool(gameContext, userInterface, EditorController.TOOL.TILE);

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