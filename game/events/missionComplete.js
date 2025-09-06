import { ArmyEventHandler } from "../armyEventHandler.js";
import { ArmyEvent } from "./armyEvent.js";
import { DropEvent } from "./drop.js";
import { MissionRewardsEvent } from "./missionRewards.js";

export const MissionCompleteEvent = function() {}

MissionCompleteEvent.prototype = Object.create(ArmyEvent.prototype);
MissionCompleteEvent.prototype.constructor = MissionCompleteEvent;

MissionCompleteEvent.prototype.onStory = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus } = world;

    const { missionID, mission, actorID } = event;
    const rewards = mission.getRewards();

    if(rewards.length !== 0) {
        eventBus.emit(ArmyEventHandler.TYPE.MISSION_REWARDS, MissionRewardsEvent.createEvent(actorID, rewards));
    }
}

MissionCompleteEvent.createEvent = function(missionID, mission, actorID) {
    return {
        "missionID": missionID,
        "mission": mission,
        "actorID": actorID
    }
}