import { COMPLETION_STATE } from "../constants.js";

export const Chapter = function(id) {
    this.id = id;
    this.name = "";
    this.desc = "";
    this.missions = [];
    this.state = COMPLETION_STATE.NOT_COMPLETED;
}

Chapter.prototype.isMissionAvailableAsNext = function(index) {
    if(index < 0 || index >= this.missions.length) {
        return false;
    }

    for(let i = 0; i < index; i++) {
        if(this.missions[i].state === COMPLETION_STATE.NOT_COMPLETED) {
            return false;
        }
    }

    return true;
}

Chapter.prototype.getNextMissionIndex = function() {
    let index = -1;

    for(let i = 0; i < this.missions.length; i++) {
        index = i;
        
        if(this.missions[i].state === COMPLETION_STATE.NOT_COMPLETED) {
            break;
        }
    }

    return index;
}

Chapter.prototype.complete = function() {
    this.state = COMPLETION_STATE.COMPLETED;

    for(const mission of this.missions) {
        mission.complete();
    }
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
