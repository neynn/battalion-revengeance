import { getCursorTile } from "./camera/contextHelper.js";
import { Display } from "./camera/display.js";
import { DEBUG } from "./debug.js";

export const ApplicationWindow = function() {
    this.isResizeQueued = false;
    this.timeUntilResize = 0;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.display = new Display();
    this.display.init(this.width, this.height, Display.TYPE.DISPLAY);
    this.display.toDocument();

    window.addEventListener("resize", () => this.queueResize());
}

ApplicationWindow.RESIZE_BUFFER_TIME = 0.2;

ApplicationWindow.prototype.update = function(gameContext) {
    const { uiManager, renderer, timer } = gameContext;

    if(this.isResizeQueued) {
        const deltaTime = timer.getDeltaTime();

        this.timeUntilResize += deltaTime;

        if(this.timeUntilResize >= ApplicationWindow.RESIZE_BUFFER_TIME) {
            this.isResizeQueued = false;
            this.timeUntilResize = 0;
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.display.resize(this.width, this.height);

            renderer.onWindowResize(this.width, this.height);
            uiManager.onWindowResize(this.width, this.height);
        }
    }
}

ApplicationWindow.prototype.queueResize = function() {
    if(!this.isResizeQueued) {
        this.timeUntilResize = 0;
        this.isResizeQueued = true;
    }
}

ApplicationWindow.prototype.drawDebug = function(gameContext) {
    const { textureLoader } = gameContext;
    const { context } = this.display;
    const { timer } = gameContext;
    const { x, y } = getCursorTile(gameContext);
    const fps = Math.round(timer.getFPS());

    if(fps >= 120) {
        context.fillStyle = "#00ff00";
    } else if(fps >= 60) {
        context.fillStyle = "#ffff00";
    } else {
        context.fillStyle = "#ff0000";
    }
    
    const TEXT_SIZE = 10;
    const WINDOW_Y = 0;
    const DEBUG_Y = TEXT_SIZE * 6;

    context.globalAlpha = 1;
    context.font = `${TEXT_SIZE}px Arial`;

    context.fillText(`FPS: ${fps}`, 0, WINDOW_Y + TEXT_SIZE);
    context.fillText(`WindowX: ${this.width}, WindowY: ${this.height}`, 0, WINDOW_Y + TEXT_SIZE * 2);
    context.fillText(`MouseX: ${x}, MouseY: ${y}`, 0, WINDOW_Y + TEXT_SIZE * 3);
    context.fillText(`Task: ${textureLoader.getCompletedTasks()}/${textureLoader.totalTasks}`, 0, WINDOW_Y + TEXT_SIZE * 4);

    context.fillText(`World: ${DEBUG.WORLD}`, 0, DEBUG_Y);
    context.fillText(`Context: ${DEBUG.CONTEXT}`, 0, DEBUG_Y + TEXT_SIZE);
    context.fillText(`Sprites: ${DEBUG.SPRITES}`, 0, DEBUG_Y + TEXT_SIZE * 2);
    context.fillText(`UI: ${DEBUG.UI}`, 0, DEBUG_Y + TEXT_SIZE * 3);
}