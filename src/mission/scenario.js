export const Scenario = function(id) {
    this.id = id;
    this.name = "";
    this.desc = "";
    this.campaigns = [];
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