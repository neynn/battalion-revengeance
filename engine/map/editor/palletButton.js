import { Button } from "../../ui/elements/button.js";

export const PalletButton = function(palletID, DEBUG_NAME) {
    Button.call(this, DEBUG_NAME);

    this.palletID = palletID;
}

PalletButton.prototype = Object.create(Button.prototype);
PalletButton.prototype.constructor = PalletButton;

PalletButton.prototype.drawCustom = function(display, localX, localY) {}

PalletButton.prototype.setCustom = function(onDraw) {
    this.drawCustom = onDraw;
}

PalletButton.prototype.onDraw = function(display, localX, localY) {
    this.drawBackground(display, localX, localY);
    this.drawCustom(display, localX, localY);
    this.drawHighlight(display, localX, localY);
    this.drawOutline(display, localX, localY);
}