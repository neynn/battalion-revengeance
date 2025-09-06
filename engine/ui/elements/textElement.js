import { TextStyle } from "../../graphics/textStyle.js";
import { UIElement } from "../uiElement.js";

export const TextElement = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);
    
    this.style = new TextStyle();
    this.fullText = "";
    this.revealedText = "";
    this.timeElapsed = 0;
    this.isLooping = false;
    this.isRevealing = false;
    this.lettersPerSecond = 2;
}

TextElement.prototype = Object.create(UIElement.prototype);
TextElement.prototype.constructor = TextElement;

TextElement.prototype.setRevealSpeed = function(revealSpeed) {
    if(revealSpeed !== undefined) {
        this.textRevealSpeed = revealSpeed;
    }
}

TextElement.prototype.setRevealing = function(isRevealing) {
    if(isRevealing !== undefined) {
        this.isRevealing = isRevealing;
    }
}

TextElement.prototype.setText = function(text) {
    if(text !== undefined) {
        this.fullText = text;

        if(this.isRevealing) {
            this.timeElapsed = 0;
            this.revealedText = "";
        } else {
            this.revealText();
        }
    }
}

TextElement.prototype.revealText = function() {
    this.revealedText = this.fullText;
}

TextElement.prototype.isCompleted = function() {
    return this.fullText.length === this.revealedText.length;
}

TextElement.prototype.onDraw = function(display, localX, localY) {
    const { context } = display;
    
    this.style.apply(context);

    context.fillText(this.revealedText, localX, localY);
}

TextElement.prototype.onUpdate = function(timestamp, deltaTime) {
    if(this.isRevealing) {
        this.timeElapsed += deltaTime;
        const revealCount = Math.floor(this.lettersPerSecond * this.timeElapsed);

        if(revealCount > 0) {
            this.timeElapsed -= revealCount / this.lettersPerSecond;
                
            for(let i = 0; i < revealCount; i++) {
                if(this.fullText.length !== this.revealedText.length) {
                    this.revealedText += this.fullText[this.revealedText.length];
                } else {
                    if(this.isLooping) {
                        this.revealedText = "";
                    } else {
                        this.timeElapsed = 0;
                    }

                    break;
                }
            }
        }
    }
}