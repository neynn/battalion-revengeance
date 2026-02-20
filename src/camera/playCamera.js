import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { Mine } from "../entity/mine.js";
import { BattalionCamera } from "./battalionCamera.js";

export const PlayCamera = function() {
    BattalionCamera.call(this);

    this.markerSprite = SpriteManager.EMPTY_SPRITE;
    this.weakMarkerSprite = SpriteManager.EMPTY_SPRITE;
    this.perspectives = new Set();
    this.mainPerspective = null;
}

PlayCamera.prototype = Object.create(BattalionCamera.prototype);
PlayCamera.prototype.constructor = PlayCamera;

PlayCamera.prototype.loadSprites = function(gameContext) {
    const { spriteManager } = gameContext;

    this.markerSprite = spriteManager.createSprite("marker");
}

PlayCamera.prototype.addPerspective = function(teamID) {
    this.perspectives.add(teamID);
}

PlayCamera.prototype.setMainPerspective = function(teamID) {
    this.mainPerspective = teamID;
}

PlayCamera.prototype.drawMines = function(tileManager, display, worldMap) {
    const { context } = display;
    const { mines } = worldMap;
    const length = mines.length;
    let count = 0;

    for(let i = 0; i < length; i++) {
        const { tileX, tileY, state, teamID } = mines[i];

        if(state === Mine.STATE.VISIBLE || this.perspectives.has(teamID)) {
            const tileID = mines[i].getTileSprite();
            
            count += this.drawTileClipped(tileManager, tileID, context, tileX, tileY);
        }
    }

    return count;
}

PlayCamera.prototype.drawEntity = function(display, entity, realTime, deltaTime) {
    const { view, flags, state, teamID } = entity;
    const { positionX, positionY, visual } = view;
    const markerX = positionX - this.fViewportX;
    const markerY = positionY - this.fViewportY;
    const opacity = visual.getOpacity();

    if(opacity < BattalionCamera.STEALTH_THRESHOLD) {
        if((flags & BattalionEntity.FLAG.IS_CLOAKED) && this.perspectives.has(teamID)) {
            visual.setOpacity(BattalionCamera.STEALTH_THRESHOLD);
            this.drawEntityBlock(display, entity, realTime, deltaTime);
            visual.setOpacity(opacity);
        } else {
            this.drawEntityBlock(display, entity, realTime, deltaTime);
        }
    } else {
        this.drawEntityBlock(display, entity, realTime, deltaTime);
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