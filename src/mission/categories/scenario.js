import { COMPLETION_STATE } from "../constants.js";

export const Scenario = function(id) {
    this.id = id;
    this.name = "";
    this.desc = "";
    this.campaigns = [];
    this.state = COMPLETION_STATE.NOT_COMPLETED;
}

Scenario.prototype.isCompleted = function() {
    for(const { state } of this.campaigns) {
        if(state !== COMPLETION_STATE.COMPLETED) {
            return false;
        }
    }

    return true;
}

Scenario.prototype.getCampaignIndex = function(campaignID) {
    for(let i = 0; i < this.campaigns.length; i++) {
        if(this.campaigns[i].id === campaignID) {
            return i;
        }
    }

    return -1;
}

Scenario.prototype.hasCampaign = function(campaignID) {
    return this.getCampaignIndex(campaignID) !== -1;
}