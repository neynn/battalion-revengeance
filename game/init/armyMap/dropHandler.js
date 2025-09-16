import { Drop } from "./drop.js";
import { Inventory } from "../../actors/player/inventory/inventory.js";
import { getRandomNumber } from "../../../engine/math/math.js";
import { DefaultTypes } from "../../defaultTypes.js";
import { ContextHelper } from "../../../engine/camera/ContextHelper.js";

export const DropHandler = function() {
    this.drops = [];
    this.deltaTime = 0;
}

DropHandler.MAX_VISIBLE_DROPS = 1000;
DropHandler.TIME_BETWEEN_SOUNDS_S = 0.5;

DropHandler.prototype.createDrop = function(gameContext, inventory, tileX, tileY, type, id, value) {
    const { spriteManager, transform2D } = gameContext;
    const transaction = DefaultTypes.createItemTransaction(type, id, value);

    if(this.drops.length < DropHandler.MAX_VISIBLE_DROPS) {
        const sprite = spriteManager.createSharedSprite("drop_money");

        if(sprite) {
            const { x, y } = transform2D.transformTileToWorldCenter(tileX, tileY);
            const drop = new Drop(transaction, inventory, sprite);
            const positionX = x + getRandomNumber(-transform2D.halfTileWidth, transform2D.halfTileWidth);

            drop.setPosition(positionX, y);

            this.drops.push(drop);
        } else {
            inventory.addByTransaction(transaction);
        }
    } else {
        inventory.addByTransaction(transaction);
    }
}

DropHandler.prototype.createDrops = function(gameContext, inventory, drops, tileX, tileY) {
    for(let i = 0; i < drops.length; i++) {
        const { type, id, value } = drops[i];
        const maxDrop = inventory.getMaxDrop(type, id);

        if(maxDrop !== 0) {
            let toDrop = value;

            while(toDrop >= maxDrop) {
                this.createDrop(gameContext, inventory, tileX, tileY, type, id, maxDrop);
                toDrop -= maxDrop;
            }

            if(toDrop !== 0) {
                this.createDrop(gameContext, inventory, tileX, tileY, type, id, toDrop);
            }
        } else {
            inventory.addByTransaction(drops[i]);
        }
    }

    const energyDrops = inventory.updateEnergyCounter();

    for(let i = 0; i < energyDrops; i++) {
        this.createDrop(gameContext, inventory, tileX, tileY, Inventory.TYPE.RESOURCE, Inventory.RESOURCE_TYPE.ENERGY, 1); 
    }
}

DropHandler.prototype.addImmediateDrops = function(inventory, drops) {
    for(let i = 0; i < drops.length; i++) {
        inventory.addByTransaction(drops[i]);
    }

    const energyDrops = inventory.updateEnergyCounter();

    inventory.addByTransaction(DefaultTypes.createItemTransaction(Inventory.TYPE.RESOURCE, Inventory.RESOURCE_TYPE.ENERGY, energyDrops));
}

DropHandler.prototype.collectAllDrops = function() {
    for(let i = 0; i < this.drops.length; i++) {
        const drop = this.drops[i];

        drop.collect();
    }

    this.drops.length = 0;
}

DropHandler.prototype.playCursorCollectSound = function(gameContext) {
    const { client } = gameContext;
    const { soundPlayer } = client;

    if(this.deltaTime >= DropHandler.TIME_BETWEEN_SOUNDS_S) {
        soundPlayer.play("sound_collect_1st_item");

        this.deltaTime = 0;
    }
}

DropHandler.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const { x, y, r } = ContextHelper.getMousePosition(gameContext);
    const fixedDeltaTime = timer.getFixedDeltaTime();
    const toRemove = [];

    this.deltaTime += fixedDeltaTime;

    for(let i = 0; i < this.drops.length; i++) {
        const drop = this.drops[i];

        drop.update(x, y, r, fixedDeltaTime);

        switch(drop.state) {
            case Drop.STATE.COLLECTING_CURSOR: {
                this.playCursorCollectSound(gameContext);
                break;
            }
            case Drop.STATE.COLLECTED: {
                toRemove.push(i);
                break;
            }
        }
    }

    for(let i = toRemove.length - 1; i >= 0; i--) {
        const index = toRemove[i];

        this.drops[index] = this.drops[this.drops.length - 1];
        this.drops.pop();
    }
}