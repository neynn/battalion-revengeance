export const Scenario = function(id) {
    this.id = id;
    this.name = "";
    this.desc = "";
    this.campaigns = [];
}

Scenario.prototype.hasCampaign = function(campaignID) {
    for(const { id } of this.campaigns) {
        if(id === campaignID) {
            return true;
        }
    }

    return false;
}