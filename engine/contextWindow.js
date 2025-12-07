export const ContextWindow = function() {
    this.isResizeQueued = false;
    this.timeUntilResize = 0;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    window.addEventListener("resize", () => this.queueResize());
}

ContextWindow.RESIZE_BUFFER_TIME = 0.2;

ContextWindow.prototype.update = function(gameContext) {
    const { uiManager, renderer, timer } = gameContext;

    if(this.isResizeQueued) {
        const deltaTime = timer.getDeltaTime();

        this.timeUntilResize += deltaTime;

        if(this.timeUntilResize >= ContextWindow.RESIZE_BUFFER_TIME) {
            this.isResizeQueued = false;
            this.timeUntilResize = 0;
            this.width = window.innerWidth;
            this.height = window.innerHeight;

            renderer.onWindowResize(this.width, this.height);
            uiManager.onWindowResize(this.width, this.height);
        }
    }
}

ContextWindow.prototype.queueResize = function() {
    if(!this.isResizeQueued) {
        this.timeUntilResize = 0;
        this.isResizeQueued = true;
    }
}
