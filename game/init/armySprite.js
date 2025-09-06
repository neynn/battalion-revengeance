import { Graph } from "../../engine/graphics/graph.js";
import { TextStyle } from "../../engine/graphics/textStyle.js";

export const ArmySprite = function() {
    Graph.call(this, "ARMY_SPRITE");

    this.isFlippable = false;
    this.healthText = "";
    this.damageText = "";

    this.card = null;
    this.cardX = 0;
    this.cardY = 0;

    this.attention = null;
    this.attentionX = 0;
    this.attentionY = 0;

    this.other = null;
    this.otherX = 0;
    this.otherY = 0;
}

ArmySprite.RENDER = {
    CARD: 0,
    ATTENTION: 1,
    OVERLAY: 2
};

ArmySprite.FLIP_STATE = {
    UNFLIPPED: 0,
    FLIPPED: 1
};

ArmySprite.OFFSET = {
    HEALTH_Y: 90,
    DAMAGE_Y: 77,
    HEALTH_X: 95,
    DAMAGE_X: 95
};

ArmySprite.TYPE = {
    LARGE: "stat_card",
    SMALL: "stat_card_small"
};

ArmySprite.TEXT = {
    COLOR: "rgba(238, 238, 238, 255)",
    FONT: "10px ArmyAttack Arial"
};

ArmySprite.prototype = Object.create(Graph.prototype);
ArmySprite.prototype.constructor = ArmySprite;

ArmySprite.prototype.onDebug = function(display, localX, localY) {
    if(this.card) {
        this.card.onDebug(display, localX + this.cardX, localY + this.cardY);
    }

    if(this.attention) {
        this.attention.onDebug(display, localX + this.attentionX, localY + this.attentionY);
    }

    if(this.other) {
        this.other.onDebug(display, localX + this.otherX, localY + this.otherY);
    }
}

ArmySprite.prototype.onDraw = function(display, localX, localY) {
    if(this.card) {
        const { context } = display;
        const cardX = localX + this.cardX;
        const cardY = localY + this.cardY;

        this.card.onDraw(display, cardX, cardY);

        context.font = ArmySprite.TEXT.FONT;
        context.fillStyle = ArmySprite.TEXT.COLOR;
        context.textAlign = TextStyle.TEXT_ALIGNMENT.RIGHT;
        context.textBaseline = TextStyle.TEXT_BASELINE.MIDDLE;

        if(this.healthText.length !== 0) {
            context.fillText(this.healthText, cardX + ArmySprite.OFFSET.HEALTH_X, cardY + ArmySprite.OFFSET.HEALTH_Y);
        }

        if(this.damageText.length !== 0) {
            context.fillText(this.damageText, cardX + ArmySprite.OFFSET.DAMAGE_X, cardY + ArmySprite.OFFSET.DAMAGE_Y);
        }
    }
    
    if(this.attention) {
        this.attention.onDraw(display, localX + this.attentionX, localY + this.attentionY);
    }
    
    if(this.other) {
        this.other.onDraw(display, localX + this.otherX, localY + this.otherY);
    }
}

ArmySprite.prototype.setFlipState = function(state) {
    if(!this.isFlippable || !this.parent) {
        return;
    }

    switch(state) {
        case ArmySprite.FLIP_STATE.UNFLIPPED: {
            this.parent.unflip();
            break;
        }
        case ArmySprite.FLIP_STATE.FLIPPED: {
            this.parent.flip();
            break;
        }
        default: {
            console.warn(`Unknown flip state ${state}`);
            break; 
        }
    }
}

ArmySprite.prototype.getMainSprite = function() {
    return this.parent;
}

ArmySprite.prototype.destroy = function() {
    if(this.parent) {
        this.parent.terminate();
    }
}

ArmySprite.prototype.updateTexture = function(gameContext, textureID) {
    const { spriteManager } = gameContext;

    if(this.parent) {
        spriteManager.updateSpriteTexture(this.parent, textureID);
    }
}

ArmySprite.prototype.swapLayer = function(gameContext, layerID) {
    const { spriteManager } = gameContext;

    if(this.parent) {
        const spriteIndex = this.parent.getIndex();

        spriteManager.swapLayer(spriteIndex, layerID);
    }
}

ArmySprite.prototype.setRender = function(type, sprite, positionX, positionY) {
    switch(type) {
        case ArmySprite.RENDER.CARD: {
            this.card = sprite;
            this.cardX = positionX;
            this.cardY = positionY;
            break;
        }
        case ArmySprite.RENDER.ATTENTION: {
            this.attention = sprite;
            this.attentionX = positionX;
            this.attentionY = positionY;
            break;
        }
        case ArmySprite.RENDER.OVERLAY: {
            this.other = sprite;
            this.otherX = positionX;
            this.otherY = positionY;
            break;
        }
    }
}

ArmySprite.prototype.removeRender = function(type) {
    switch(type) {
        case ArmySprite.RENDER.CARD: {
            this.card = null;
            this.cardX = 0;
            this.cardY = 0;
            break;
        }
        case ArmySprite.RENDER.ATTENTION: {
            this.attention = null;
            this.attentionX = 0;
            this.attentionY = 0;
            break;
        }
        case ArmySprite.RENDER.OVERLAY: {
            this.other = null;
            this.otherX = 0;
            this.otherY = 0;
            break;
        }
    }
}

ArmySprite.prototype.setHealthText = function(healthText) {
    this.healthText = healthText;
}

ArmySprite.prototype.setDamageText = function(damageText) {
    this.damageText = damageText;
}