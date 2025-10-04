import { Autotiler } from "../../../engine/tile/autotiler.js";
import { PlayCamera } from "../../camera/playCamera.js";
import { ArmyEntity } from "../../init/armyEntity.js";
import { ArmyMap } from "../../init/armyMap.js";

export const RangeVisualizer = function() {
    this.state = RangeVisualizer.STATE.ACTIVE;
    this.isEnabled = true;
    this.lastTarget = null;
}

RangeVisualizer.STATE = {
    INACTIVE: 0,
    ACTIVE: 1
};

RangeVisualizer.prototype.toggle = function(gameContext, camera) {
    if(!this.isEnabled) {
        return this.state;
    }

    switch(this.state) {
        case RangeVisualizer.STATE.INACTIVE: {
            this.state = RangeVisualizer.STATE.ACTIVE;
            break;
        }
        case RangeVisualizer.STATE.ACTIVE: {
            this.state = RangeVisualizer.STATE.INACTIVE;
            this.removeLastTarget(gameContext, camera);
            break;
        }
    }

    return this.state;
}

RangeVisualizer.prototype.show = function(gameContext, camera, entity) {
    const attackComponent = entity.getComponent(ArmyEntity.COMPONENT.ATTACK);

    if(!attackComponent) {
        return;
    }

    const { tileManager } = gameContext;
    const autotiler = tileManager.getAutotilerByID(ArmyMap.AUTOTILER.RANGE);
    const { range } = attackComponent;

    entity.sprite.swapLayer(gameContext, 2);

    const startX = entity.tileX - range;
    const startY = entity.tileY - range;
    const endX = entity.tileX + range + entity.config.dimX - 1;
    const endY = entity.tileY + range + entity.config.dimY - 1;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            const tileID = autotiler.run(j, i, (x, y) => {
                if(x >= startX && x <= endX && y >= startY && y <= endY) {
                    return Autotiler.RESPONSE.VALID;
                } 

                return Autotiler.RESPONSE.INVALID;
            });

            camera.pushOverlay(PlayCamera.OVERLAY.RANGE, tileID, j, i);
        }
    }
}

RangeVisualizer.prototype.hide = function(gameContext, camera) {
    const { world } = gameContext;
    const { entityManager } = world;
    const entity = entityManager.getEntity(this.lastTarget);

    camera.clearOverlay(PlayCamera.OVERLAY.RANGE);

    if(entity) {
        entity.sprite.swapLayer(gameContext, 1);
    }
}

RangeVisualizer.prototype.update = function(gameContext, player) {
    if(this.isEnabled && this.state === RangeVisualizer.STATE.ACTIVE) {
        const { hover, camera } = player;
        const entity = hover.getEntity(gameContext);

        if(entity !== null) {
            const entityID = entity.getID();

            if(entityID !== this.lastTarget) {
                this.removeLastTarget(gameContext, camera);
                this.show(gameContext, camera, entity);
                this.lastTarget = entityID;
            }
        } else {
            this.removeLastTarget(gameContext, camera);
        }
    }
}

RangeVisualizer.prototype.removeLastTarget = function(gameContext, camera) {
    if(this.lastTarget !== null) {
        this.hide(gameContext, camera);
        this.lastTarget = null;
    }
}

RangeVisualizer.prototype.enable = function() {
    if(!this.isEnabled) {
        this.isEnabled = true;
    }
}

RangeVisualizer.prototype.disable = function(gameContext, camera) {
    if(this.isEnabled) {
        this.isEnabled = false;
        this.removeLastTarget(gameContext, camera);
    }
}
