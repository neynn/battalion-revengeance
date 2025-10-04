import { Overlay } from "../../engine/camera/overlay.js";
import { EntityHelper } from "../../engine/entity/entityHelper.js";
import { Layer } from "../../engine/map/layer.js";
import { Renderer } from "../../engine/renderer.js";
import { ArmyCamera } from "../armyCamera.js";
import { ArmyMap } from "../init/armyMap.js";
import { PathfinderSystem } from "../systems/pathfinder.js";

export const PlayCamera = function() {
    ArmyCamera.call(this);

    this.overlays[PlayCamera.OVERLAY.ATTACK] = new Overlay();
    this.overlays[PlayCamera.OVERLAY.MOVE] = new Overlay();
    this.overlays[PlayCamera.OVERLAY.RANGE] = new Overlay();
    this.overlays[PlayCamera.OVERLAY.FIRE_MISSION] = new Overlay();
    this.customLayers[PlayCamera.LAYER.BORDER] = new Layer();
    this.customLayers[PlayCamera.LAYER.PLACE] = new Layer();
}

PlayCamera.OVERLAY = {
    ATTACK: 0,
    MOVE: 1,
    RANGE: 2,
    FIRE_MISSION: 3
};

PlayCamera.LAYER = {
    BORDER: 0,
    PLACE: 1
};

PlayCamera.prototype = Object.create(ArmyCamera.prototype);
PlayCamera.prototype.constructor = PlayCamera;

PlayCamera.prototype.update = function(gameContext, display) {
    const { world, timer, spriteManager, tileManager } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }
    
    const { context } = display;
    const deltaTime = timer.getDeltaTime();
    const realTime = timer.getRealTime();

    this.updateWorldBounds();
    this.clampWorldBounds();
    this.floorRenderCoordinates();
    this.drawLayer(tileManager, display, worldMap.getLayer(ArmyMap.LAYER.GROUND));

    if(gameContext.settings.drawBorder) {
        this.drawLayer(tileManager, display, this.customLayers[PlayCamera.LAYER.BORDER]);
    }

    this.drawLayer(tileManager, display, worldMap.getLayer(ArmyMap.LAYER.DECORATION));
    this.drawDebris(gameContext, context, worldMap);
    this.drawOverlay(tileManager, context, this.overlays[PlayCamera.OVERLAY.MOVE]);
    this.drawOverlay(tileManager, context, this.overlays[PlayCamera.OVERLAY.ATTACK]);
    this.drawSpriteBatchYSorted(display, spriteManager.getLayer(0), realTime, deltaTime);
    this.drawSpriteBatchYSorted(display, spriteManager.getLayer(1), realTime, deltaTime);
    this.drawLayer(tileManager, display, this.customLayers[PlayCamera.LAYER.PLACE]);
    this.drawOverlay(tileManager, context, this.overlays[PlayCamera.OVERLAY.FIRE_MISSION]);
    this.drawOverlay(tileManager, context, this.overlays[PlayCamera.OVERLAY.RANGE]);
    this.drawSpriteBatchYSorted(display, spriteManager.getLayer(2), realTime, deltaTime);
    this.drawSpriteBatchYSorted(display, spriteManager.getLayer(3), realTime, deltaTime);
    this.drawDrops(display, worldMap);
    this.drawLayer(tileManager, display, worldMap.getLayer(ArmyMap.LAYER.CLOUD));

    if(Renderer.DEBUG.MAP) {
        this.debugMap(context, worldMap);
    }
}

PlayCamera.prototype.debugMap = function(context, worldMap) {
    const scaleX = this.tileWidth / 6;
    const scaleY = this.tileHeight / 6;

    context.globalAlpha = 1;
    context.font = `${scaleX}px Arial`;
    context.textBaseline = "middle";
    context.textAlign = "center";

    context.fillStyle = "#ff0000";
    this.drawBufferData(context, worldMap.getLayer(ArmyMap.LAYER.TYPE).buffer, scaleX, scaleY);

    context.fillStyle = "#00ff00";
    this.drawBufferData(context, worldMap.getLayer(ArmyMap.LAYER.TEAM).buffer, this.tileWidth - scaleX, scaleY);

    context.fillStyle = "#0000ff";
    this.drawBufferData(context, this.customLayers[PlayCamera.LAYER.BORDER].buffer, scaleX, this.tileHeight - scaleY);

    context.fillStyle = "#ffff00";
    this.drawBufferData(context, worldMap.getLayer(ArmyMap.LAYER.GROUND).buffer, this.tileWidth - scaleX, this.tileHeight - scaleY);

    this.drawMapOutlines(context);
}

PlayCamera.prototype.updateMoveOverlay = function(gameContext, nodeList, enableTileID, attackTileID) {
    const showInvalidTiles = gameContext.settings.debug.showInvalidMoveTiles;

    this.clearOverlay(PlayCamera.OVERLAY.MOVE);

    for(let i = 0; i < nodeList.length; i++) {
        const { node, state } = nodeList[i];
        const { positionX, positionY } = node;

        if(state !== PathfinderSystem.NODE_STATE.VALID) {
            if(showInvalidTiles) {
                this.pushOverlay(PlayCamera.OVERLAY.MOVE, attackTileID, positionX, positionY);
            }

        } else {
            const tileEntity = EntityHelper.getTileEntity(gameContext, positionX, positionY);

            if(!tileEntity) {
                this.pushOverlay(PlayCamera.OVERLAY.MOVE, enableTileID, positionX, positionY);
            }
        } 
    }
}