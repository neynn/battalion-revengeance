import { Button } from "../../ui/elements/button.js";
import { UICollider } from "../../ui/uiCollider.js";

export const PalletButton = function(palletID, DEBUG_NAME) {
    Button.call(this, DEBUG_NAME);

    this.palletID = palletID;
    this.drawCustom = false;
}

PalletButton.prototype = Object.create(Button.prototype);
PalletButton.prototype.constructor = PalletButton;

PalletButton.prototype.disableCustom = function() {
    this.drawCustom = false;
}

PalletButton.prototype.enableCustom = function(onDraw) {
    this.onDrawCustom = onDraw;
    this.drawCustom = true;
}

PalletButton.prototype.removeClick = function() {
    this.collider.events.unsubscribe(UICollider.EVENT.CLICKED, this.id);
}

PalletButton.prototype.addClick = function(onClick) {
    this.collider.events.on(UICollider.EVENT.CLICKED, onClick, { id: this.id });
}

PalletButton.prototype.onDrawCustom = function(display, localX, localY) {}

PalletButton.prototype.onDraw = function(display, localX, localY) {
    this.onDrawBackground(display, localX, localY);

    if(this.drawCustom) {
        this.onDrawCustom(display, localX, localY);
    }

    this.onDrawHighlight(display, localX, localY);
    this.onDrawOutline(display, localX, localY);
}