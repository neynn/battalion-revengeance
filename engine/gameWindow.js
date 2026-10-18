import { Display } from "./renderer/display.js";

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
        this.timeUntilResize += timer.deltaTime;

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