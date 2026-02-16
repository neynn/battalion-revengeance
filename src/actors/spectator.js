import { getCursorTile } from "../../engine/camera/contextHelper.js";
import { BattalionActor } from "./battalionActor.js";
import { MapInspector } from "./player/inspector.js";

export const Spectator = function(id, camera) {
    BattalionActor.call(this, id);

    this.camera = camera;
    this.inspector = new MapInspector(camera);
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
    const hoverChanged = this.inspector.update(gameContext, this);

    if(hoverChanged) {
        //TODO: Update camera.
    }
}

Spectator.prototype.getVisibleEntity = function(gameContext, tileX, tileY) {
    const { world } = gameContext;
    const entity = world.getEntityAt(tileX, tileY);

    if(entity) {
        return entity;
    }

    return null;
}