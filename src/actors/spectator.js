import { getCursorTile } from "../../engine/camera/contextHelper.js";
import { BattalionActor } from "./battalionActor.js";
import { MapInspector } from "../map/mapInspector.js";

export const Spectator = function(id, inspector, renderer) {
    BattalionActor.call(this, id);

    this.renderer = renderer;
    this.inspector = inspector;
}

Spectator.prototype = Object.create(BattalionActor.prototype);
Spectator.prototype.constructor = Spectator;

Spectator.prototype.onClick = function(gameContext, tileX, tileY) {
    this.inspector.inspect(gameContext, this, tileX, tileY);
}

Spectator.prototype.loadKeybinds = function(gameContext) {
    const { client } = gameContext;
    const { router } = client;
    
    router.bind(gameContext, "SPECTATOR");
    router.on("CLICK", () => {
        const { world } = gameContext;
        const { mapManager } = world;
        const worldMap = mapManager.getActiveMap();

        if(worldMap) {
            const { x, y } = getCursorTile(gameContext);

            this.onClick(gameContext, x, y);
        }
    });
}


Spectator.prototype.update = function(gameContext) {
    const flags = this.inspector.update(gameContext);
}