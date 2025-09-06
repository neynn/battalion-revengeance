import { ArmyEvent } from "./armyEvent.js";

export const MissionRewardsEvent = function() {}

MissionRewardsEvent.prototype = Object.create(ArmyEvent.prototype);
MissionRewardsEvent.prototype.constructor = MissionRewardsEvent;

MissionRewardsEvent.prototype.onStory = function(gameContext, event) {
    const { world } = gameContext;
    const { turnManager } = world;
    const { actorID, rewards } = event;
    const actor = turnManager.getActor(actorID);

    if(actor && actor.inventory) {
        for(let i = 0; i < rewards.length; i++) {
            actor.inventory.addByTransaction(rewards[i]);
        }
    }
}

MissionRewardsEvent.createEvent = function(actorID, rewards) {
    return {
        "actorID": actorID,
        "rewards": rewards
    }
}