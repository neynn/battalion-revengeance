import { getCursorTile } from "../../engine/camera/contextHelper.js";
import { BattalionActor } from "./battalionActor.js";
import { INPUT_TRIGGER } from "../enums.js";

export const Spectator = function(id, renderer) {
    BattalionActor.call(this, id);

    this.renderer = renderer;
}

Spectator.prototype = Object.create(BattalionActor.prototype);
Spectator.prototype.constructor = Spectator;

Spectator.prototype.onClick = function(gameContext, tileX, tileY) {
    const { mapInspector } = gameContext;

    mapInspector.inspect(gameContext, this, tileX, tileY);
}

Spectator.prototype.loadKeybinds = function(gameContext) {
    const { client } = gameContext;
    const { router } = client;
    
    router.useConfig(gameContext, "SPECTATOR", INPUT_TRIGGER);

    router.on(INPUT_TRIGGER.CLICK, () => {
        const { world } = gameContext;
        const worldMap = world.getWorldMap();

        if(worldMap) {
            const { x, y } = getCursorTile(gameContext);

            this.onClick(gameContext, x, y);
        }
    });
}