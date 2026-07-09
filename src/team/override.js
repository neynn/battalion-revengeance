import { TeamManager } from "./teamManager.js";

export const TeamOverride = function() {
    this.team = TeamManager.INVALID_ID;
    this.color = null;
    this.name = null;
    this.allies = [];
}