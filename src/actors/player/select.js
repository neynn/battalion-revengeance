import { PlayerState } from "./playerState.js";

export const SelectState = function() {
    PlayerState.call(this);
}

SelectState.prototype = Object.create(PlayerState.prototype);
SelectState.prototype.constructor = SelectState;