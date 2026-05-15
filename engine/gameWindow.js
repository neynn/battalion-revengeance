import { getCursorTile } from "./camera/contextHelper.js";
import { Display } from "./renderer/display.js";
import { Renderer2D } from "./renderer/renderer2D.js";

const RESIZE_BUFFER_TIME = 0.2;

export const GameWindow = function() {
    this.isResizeQueued = false;
    this.timeUntilResize = 0;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.debug = true;

    this.display = new Display(this.width, this.height, Display.TYPE.DISPLAY);
    this.display.toDocument();

    window.addEventListener("resize", () => this.queueResize());
}

GameWindow.prototype.update = function(gameContext) {
    const { uiManager, contextManager, timer } = gameContext;

    if(this.isResizeQueued) {
        const deltaTime = timer.getDeltaTime();

        this.timeUntilResize += deltaTime;

        if(this.timeUntilResize >= RESIZE_BUFFER_TIME) {
            this.isResizeQueued = false;
            this.timeUntilResize = 0;
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.display.resize(this.width, this.height);

            contextManager.onWindowResize(this.width, this.height);
            uiManager.onWindowResize(this.width, this.height);
        }
    }
}

GameWindow.prototype.queueResize = function() {
    if(!this.isResizeQueued) {
        this.timeUntilResize = 0;
        this.isResizeQueued = true;
    }
}

GameWindow.prototype.drawDebug = function(gameContext) {
    const { textureLoader, timer, uiManager, contextManager } = gameContext;
    const { context } = this.display;
    const { smoothFPS, targetFPS } = timer;
    const { x, y } = getCursorTile(gameContext);
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
    const DEBUG_Y = TEXT_SIZE * 6;

    context.globalAlpha = 1;
    context.font = `${TEXT_SIZE}px Arial`;

    context.fillText(`FPS: ${fps} | ${delta}`, 0, WINDOW_Y + TEXT_SIZE);
    context.fillText(`WindowX: ${this.width}, WindowY: ${this.height}`, 0, WINDOW_Y + TEXT_SIZE * 2);
    context.fillText(`MouseX: ${x}, MouseY: ${y}`, 0, WINDOW_Y + TEXT_SIZE * 3);
    context.fillText(`Task: ${textureLoader.getCompletedTasks()}/${textureLoader.totalTasks}`, 0, WINDOW_Y + TEXT_SIZE * 4);

    context.fillText(`World: ${Renderer2D.DEBUG.WORLD}`, 0, DEBUG_Y);
    context.fillText(`Context: ${contextManager.debug}`, 0, DEBUG_Y + TEXT_SIZE);
    context.fillText(`Sprites: ${Renderer2D.DEBUG.SPRITES}`, 0, DEBUG_Y + TEXT_SIZE * 2);
    context.fillText(`UI: ${uiManager.debug}`, 0, DEBUG_Y + TEXT_SIZE * 3);
}