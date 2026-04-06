import { COMPLETION_STATE } from "../constants.js";

export const Chapter = function(id) {
    this.id = id;
    this.name = "";
    this.desc = "";
    this.missions = [];
    this.state = COMPLETION_STATE.NOT_COMPLETED;
}

Chapter.prototype.isCompleted = function() {
    for(const { state } of this.missions) {
        if(state !== COMPLETION_STATE.COMPLETED) {
            return false;
        }
    }

    return true;
}

Chapter.prototype.getMissionIndex = function(missionID) {
    for(let i = 0; i < this.missions.length; i++) {
        if(this.missions[i].id === missionID) {
            return i;
        }
    }

    return -1;
}

Chapter.prototype.hasMission = function(missionID) {
    return this.getMissionIndex(missionID) !== -1;
}
