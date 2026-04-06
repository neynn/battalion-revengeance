import { NATION_TYPE } from "../enums.js";
import { Campaign } from "./campaign.js";
import { Chapter } from "./chapter.js";
import { Mission } from "./mission.js";
import { Scenario } from "./scenario.js";

export const MissionManager = function() {
	this.scenarios = new Map();
	this.campaigns = new Map();
	this.chapters = new Map();
	this.missions = new Map();

	this.currentScenario = null;
	this.currentCampaign = null;
	this.currentChapter = null;
	this.currentMission = null;
}

MissionManager.prototype.load = function(resources) {
    const { scenarios, campaigns, chapters, missions } = resources;

    for(const missionID in missions) {
        const { name, desc, playlist = null, map = null } = missions[missionID];
        const mission = new Mission(missionID);

        mission.name = name;
        mission.desc = desc;
        
        if(playlist !== null) {
            mission.playlist = playlist;
        }

        if(map !== null) {
            mission.map = map;
        }

        this.missions.set(missionID, mission);
    }

    for(const chapterID in chapters) {
        const { name, desc, missions } = chapters[chapterID];
        const chapter = new Chapter(chapterID);

        chapter.name = name;
        chapter.desc = desc;

        for(const missionID of missions) {
            const mission = this.missions.get(missionID);

            if(mission) {
                chapter.missions.push(mission);
            }
        }

        this.chapters.set(chapterID, chapter);
    }

    for(const campaignID in campaigns) {
        const { name, desc, nation, hidden = false, chapters } = campaigns[campaignID];
        const campaign = new Campaign(campaignID);

        campaign.name = name;
        campaign.desc = desc;
        campaign.nation = NATION_TYPE[nation] ?? NATION_TYPE.SOMERTIN;
        campaign.isHidden = hidden;

        for(const chapterID of chapters) {
            const chapter = this.chapters.get(chapterID);

            if(chapter) {
                campaign.chapters.push(chapter);
            }
        }

        this.campaigns.set(campaignID, campaign);
    }

    for(const scenarioID in scenarios) {
        const { name, desc, campaigns } = scenarios[scenarioID];
        const scenario = new Scenario(scenarioID);

        scenario.name = name;
        scenario.desc = desc;

        for(const campaignID of campaigns) {
            const campaign = this.campaigns.get(campaignID);

            if(campaign) {
                scenario.campaigns.push(campaign);
            }
        }

        this.scenarios.set(scenarioID, scenario);
    }
}

MissionManager.prototype.deselectScenario = function() {
    this.currentScenario = null;
    this.currentCampaign = null;
    this.currentChapter = null;
    this.currentMission = null;
}

MissionManager.prototype.deselectCampaign = function() {
    this.currentCampaign = null;
    this.currentChapter = null;
    this.currentMission = null;
}

MissionManager.prototype.deselectChapter = function() {
    this.currentChapter = null;
    this.currentMission = null;
}

MissionManager.prototype.deselectMission = function() {
    this.currentMission = null;
}

MissionManager.prototype.selectScenario = function(scenarioID) {
    const scenario = this.scenarios.get(scenarioID);

    if(!scenario) {
        return;
    }

    this.currentScenario = scenario;
    this.deselectCampaign();
}

MissionManager.prototype.selectCampaign = function(campaignID) {
    if(!this.currentScenario) {
        return;
    }

    if(!this.currentScenario.hasCampaign(campaignID)) {
        return;
    }

    this.currentCampaign = this.campaigns.get(campaignID);
    this.deselectChapter();
}

MissionManager.prototype.selectChapter = function(chapterID) {
    if(!this.currentCampaign) {
        return;
    }

    if(!this.currentCampaign.hasChapter(chapterID)) {
        return;
    }

    this.currentChapter = this.chapters.get(chapterID);
    this.deselectMission();
}

MissionManager.prototype.selectMission = function(missionID) {
    if(!this.currentChapter) {
        return;
    }

    if(!this.currentChapter.hasMission(missionID)) {
        return;
    }

    this.currentMission = this.missions.get(missionID);
}

MissionManager.prototype.save = function() {
    const scenarios = {};
    const campaigns = {};
    const chapters = {};
    const missions = {};

    for(const [scenarioID, scenario] of this.scenarios) {
        scenarios[scenarioID] = 1;
    }

    for(const [campaignID, campaign] of this.campaigns) {
        campaigns[campaignID] = 1;
    }

    for(const [chapterID, chapter] of this.chapters) {
        chapters[chapterID] = 1;
    }

    for(const [missionID, mission] of this.missions) {
        missions[missionID] = 1;
    }

    return {
        scenarios,
        campaigns,
        chapters,
        missions
    }
}

MissionManager.prototype.exit = function() { 

}