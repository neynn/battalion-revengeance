import { COMPLETION_STATE } from "../constants.js";

export const Mission = function(id) {
    this.id = id;
    this.name = "";
    this.desc = "";
    this.playlist = "GENERIC";
    this.map = null;
    this.state = COMPLETION_STATE.NOT_COMPLETED;
}