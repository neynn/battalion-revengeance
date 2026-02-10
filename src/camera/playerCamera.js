import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { Mine } from "../entity/mine.js";
import { mineTypeToTile } from "../enumHelpers.js";
import { BattalionCamera } from "./battalionCamera.js";

export const PlayerCamera = function() {
    BattalionCamera.call(this);

    this.markerSprite = SpriteManager.EMPTY_SPRITE;
    this.weakMarkerSprite = SpriteManager.EMPTY_SPRITE;
    this.perspectives = new Set();
    this.mainPerspective = null;
}

PlayerCamera.prototype = Object.create(BattalionCamera.prototype);
PlayerCamera.prototype.constructor = PlayerCamera;

PlayerCamera.prototype.loadSprites = function(gameContext) {
    const { spriteManager } = gameContext;

    this.markerSprite = spriteManager.createSprite("marker");
}

PlayerCamera.prototype.addPerspective = function(teamID) {
    this.perspectives.add(teamID);
}

PlayerCamera.prototype.setMainPerspective = function(teamID) {
    this.mainPerspective = teamID;
}

PlayerCamera.prototype.drawMines = function(tileManager, display, worldMap) {
    const { context } = display;
    const { mines } = worldMap;
    const length = mines.length;
    let count = 0;

    for(let i = 0; i < length; i++) {
        const { tileX, tileY, state, teamID, type } = mines[i];

        if(state === Mine.STATE.VISIBLE || this.perspectives.has(teamID)) {
            const tileID = mineTypeToTile(type);
            
            count += this.drawTileClipped(tileManager, tileID, context, tileX, tileY);
        }
    }

    return count;
}

PlayerCamera.prototype.drawEntity = function(entity, display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime) {
    const { view, flags, state, teamID } = entity;
    const { positionX, positionY, visual } = view;
    const markerX = positionX - viewportLeftEdge;
    const markerY = positionY - viewportTopEdge;
    const opacity = visual.getOpacity();

    if(opacity < BattalionCamera.STEALTH_THRESHOLD) {
        if((flags & BattalionEntity.FLAG.IS_CLOAKED) && this.perspectives.has(teamID)) {
            visual.setOpacity(BattalionCamera.STEALTH_THRESHOLD);
            view.draw(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
            visual.setOpacity(opacity);
        } else {
            view.draw(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);  
        }
    } else {
        view.draw(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
    }

    if(state === BattalionEntity.STATE.IDLE && entity.canAct()) {
        display.setAlpha(1);

        if(teamID === this.mainPerspective) {
            this.markerSprite.onDraw(display, markerX, markerY);
        } else {
            this.weakMarkerSprite.onDraw(display, markerX, markerY);
        }
    }
}