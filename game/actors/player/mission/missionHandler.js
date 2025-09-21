import { EventEmitter } from "../../../../engine/events/eventEmitter.js";
import { Mission } from "./mission.js";
import { MissionGroup } from "./missionGroup.js";

export const MissionHandler = function() {
    this.groups = new Map();
    this.currentGroup = null;

    this.events = new EventEmitter();
    this.events.register(MissionHandler.EVENT.MISSION_COMPLETE);
}

MissionHandler.EVENT = {
    MISSION_COMPLETE: "MISSION_COMPLETE"
}

MissionHandler.prototype.clear = function() {
    this.groups.clear();
    this.currentGroup = null;
}

MissionHandler.prototype.deselectGroup = function() {
    this.currentGroup = null;
}

MissionHandler.prototype.selectGroup = function(groupID) {
    const group = this.groups.get(groupID);

    if(group) {
        this.currentGroup = group;
    } else {
        this.currentGroup = null;
    }
}

MissionHandler.prototype.createGroup = function(groupID, missions) {
    if(!this.groups.has(groupID)) {
        const group = new MissionGroup();

        group.init(missions);

        this.groups.set(groupID, group);
    }
}

MissionHandler.prototype.load = function(groups) {
    for(const groupID in groups) {
        const group = this.groups.get(groupID);

        if(group) {
            group.load(groups[groupID]);
        }
    }
}

MissionHandler.prototype.save = function() {
    const groups = {};

    for(const [groupID, group] of this.groups) {
        groups[groupID] = group.save();
    }

    return groups;
}

MissionHandler.prototype.onObjective = function(type, parameter, count) {
    if(this.currentGroup) {
        for(const [missionID, mission] of this.currentGroup.missions) {
            mission.onObjective(type, parameter, count);

            const isCompleted = mission.complete();

            if(isCompleted) {
                this.events.emit(MissionHandler.EVENT.MISSION_COMPLETE, missionID, mission);
            }
        }

        this.currentGroup.unlockMissions();
        this.currentGroup.updateState();
    }
}

MissionHandler.prototype.getCurrentActiveMissions = function() {
    const missions = [];

    if(this.currentGroup) {
        for(const [missionID, mission] of this.currentGroup.missions) {
            if(mission.state === Mission.STATE.STARTED) {
                missions.push(mission);
            }
        }
    }

    return missions;
}