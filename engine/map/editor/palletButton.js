import { Button } from "../../ui/elements/button.js";

export const PalletButton = function(palletID, DEBUG_NAME) {
    Button.call(this, DEBUG_NAME);

    this.palletID = palletID;
}

PalletButton.prototype = Object.create(Button.prototype);
PalletButton.prototype.constructor = PalletButton;

PalletButton.prototype.onDrawCustom = function(display, localX, localY) {}

PalletButton.prototype.setCustom = function(onDraw) {
    this.onDrawCustom = onDraw;
}

PalletButton.prototype.onDraw = function(display, localX, localY) {
    this.onDrawBackground(display, localX, localY);
    this.onDrawCustom(display, localX, localY);
    this.onDrawHighlight(display, localX, localY);
    this.onDrawOutline(display, localX, localY);
}