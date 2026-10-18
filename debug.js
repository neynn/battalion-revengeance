import { getCursorTile } from "./engine/camera/contextHelper.js";
import { Renderer2D } from "./engine/renderer/renderer2D.js";

export const drawWindowDebug = function(gContext, gTimer, gWindow) {
    const { textureRegistry, textureLoader, uiManager, contextManager } = gContext;
    const { context } = gWindow.display;
    const { smoothFPS, targetFPS } = gTimer;
    const { x, y } = getCursorTile(gContext);
    const fps = Math.round(smoothFPS);
    const delta = targetFPS - fps;

    if(delta >= Math.floor(targetFPS / 2)) {
        context.fillStyle = "#ff0000";
    } else if(delta >= Math.floor(targetFPS / 4)) {
        context.fillStyle = "#ffff00";
    } else {
        context.fillStyle = "#00ff00";
    }

    const TEXT_SIZE = 10;
    const WINDOW_Y = 0;
    const DEBUG_Y = TEXT_SIZE * 7;

    context.globalAlpha = 1;
    context.font = `${TEXT_SIZE}px Arial`;

    context.fillText(`FPS: ${fps} | ${delta}`, 0, WINDOW_Y + TEXT_SIZE);
    context.fillText(`WindowX: ${gWindow.width}, WindowY: ${gWindow.height}`, 0, WINDOW_Y + TEXT_SIZE * 2);
    context.fillText(`MouseX: ${x}, MouseY: ${y}`, 0, WINDOW_Y + TEXT_SIZE * 3);
    context.fillText(`KB-Images: ${textureRegistry.getKBUsed()}`, 0, WINDOW_Y + TEXT_SIZE * 4);
    context.fillText(`Task: ${textureLoader.getCompletedTasks()}/${textureLoader.totalTasks}`, 0, WINDOW_Y + TEXT_SIZE * 5);

    context.fillText(`World: ${Renderer2D.DEBUG.WORLD}`, 0, DEBUG_Y);
    context.fillText(`Context: ${contextManager.debug}`, 0, DEBUG_Y + TEXT_SIZE);
    context.fillText(`Sprites: ${Renderer2D.DEBUG.SPRITES}`, 0, DEBUG_Y + TEXT_SIZE * 2);
    context.fillText(`UI: ${uiManager.debug}`, 0, DEBUG_Y + TEXT_SIZE * 3);
}

export const addDebugKeybinds = function(gContext, gWindow) {
    const { client, uiManager, contextManager } = gContext;
    const { router } = client;

    router.bind(gContext, "DEBUG");
    router.on("DEBUG_MAP", () => Renderer2D.DEBUG.WORLD = !Renderer2D.DEBUG.WORLD);
    router.on("DEBUG_CONTEXT", () => contextManager.debug = !contextManager.debug);
    router.on("DEBUG_INTERFACE", () => uiManager.debug = !uiManager.debug);
    router.on("DEBUG_SPRITES", () => Renderer2D.DEBUG.SPRITES = !Renderer2D.DEBUG.SPRITES);
    router.on("DEBUG_INFO", () => gWindow.debug = !gWindow.debug);
}