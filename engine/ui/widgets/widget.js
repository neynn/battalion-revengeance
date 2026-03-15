import { ANCHOR_TYPE } from "../constants.js";

export const Widget = function() {
    this.anchor = ANCHOR_TYPE.TOP_LEFT;
    this.positionX = 0;
    this.positionY = 0;
    this.width = 0;
    this.height = 0;
}