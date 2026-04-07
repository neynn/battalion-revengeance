import { NATION_TYPE } from "../enums.js";
import { COMPLETION_STATE, MAX_CHAPTERS, MAX_MISSIONS, VICTORY_FLAG } from "./constants.js";
import { Campaign } from "./categories/campaign.js";
import { Chapter } from "./categories/chapter.js";
import { Mission } from "./categories/mission.js";
import { Scenario } from "./categories/scenario.js";

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
        let count = 0;

        chapter.name = name;
        chapter.desc = desc;

        for(const missionID of missions) {
            const mission = this.missions.get(missionID);

            if(mission) {
                chapter.missions.push(mission);
                count++;
            }

            if(count >= MAX_MISSIONS) {
                break;
            }
        }

        this.chapters.set(chapterID, chapter);
    }

    for(const campaignID in campaigns) {
        const { name, desc, nation, hidden = false, chapters } = campaigns[campaignID];
        const campaign = new Campaign(campaignID);
        let count = 0;

        campaign.name = name;
        campaign.desc = desc;
        campaign.nation = NATION_TYPE[nation] ?? NATION_TYPE.SOMERTIN;
        campaign.isHidden = hidden;

        for(const chapterID of chapters) {
            const chapter = this.chapters.get(chapterID);

            if(chapter) {
                campaign.chapters.push(chapter);
                count++;
            }

            if(count >= MAX_CHAPTERS) {
                break;
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

MissionManager.prototype.selectChapterIfPossible = function(index) {
    if(!this.currentCampaign) {
        return null;
    }

    if(!this.currentCampaign.isChapterAvailableAsNext(index)) {
        return null;
    }

    this.currentChapter = this.currentCampaign.chapters[index];
    this.deselectMission();

    return this.currentChapter;
}

MissionManager.prototype.selectMissionIfPossible = function(index) {
    if(!this.currentChapter) {
        return null;
    }

    if(!this.currentChapter.isMissionAvailableAsNext(index)) {
        return null;
    }

    this.currentMission = this.currentChapter.missions[index];

    return this.currentMission;
}

MissionManager.prototype.getNextMissionIndex = function() {
    if(!this.currentChapter) {
        return -1;
    }

    return this.currentChapter.getNextMissionIndex();
}

MissionManager.prototype.getNextChapterIndex = function() {
    if(!this.currentCampaign) {
        return -1;
    }

    return this.currentCampaign.getNextChapterIndex();
}

MissionManager.prototype.onVictory = function() {
    let victoryFlags = VICTORY_FLAG.NONE;

    if(!this.currentMission) {
        return victoryFlags;
    }

    if(this.currentMission.state === COMPLETION_STATE.NOT_COMPLETED) {
        this.currentMission.state = COMPLETION_STATE.COMPLETED;
        victoryFlags |= VICTORY_FLAG.MISSION_FIRST;

        if(this.currentChapter.state === COMPLETION_STATE.NOT_COMPLETED) {
            if(this.currentChapter.isCompleted()) {
                this.currentChapter.state = COMPLETION_STATE.COMPLETED;
                victoryFlags |= VICTORY_FLAG.CHAPTER_FIRST;
    
                if(this.currentCampaign.state === COMPLETION_STATE.NOT_COMPLETED) {
                    if(this.currentCampaign.isCompleted()) {
                        this.currentCampaign.state = COMPLETION_STATE.COMPLETED;
                        victoryFlags |= VICTORY_FLAG.CAMPAIGN_FIRST;
    
                        if(this.currentScenario.state === COMPLETION_STATE.NOT_COMPLETED) {
                            if(this.currentScenario.isCompleted()) {
                                this.currentScenario.state = COMPLETION_STATE.COMPLETED;
                                victoryFlags |= VICTORY_FLAG.SCENARIO_FIRST;
                            }
                        }
                    }
                }
            }
        }
    }

    return victoryFlags;
}

MissionManager.prototype.save = function() {
    const scenarios = {};
    const campaigns = {};
    const chapters = {};
    const missions = {};

    for(const [scenarioID, scenario] of this.scenarios) {
        scenarios[scenarioID] = scenario.state;
    }

    for(const [campaignID, campaign] of this.campaigns) {
        campaigns[campaignID] = campaign.state;
    }

    for(const [chapterID, chapter] of this.chapters) {
        chapters[chapterID] = chapter.state;
    }

    for(const [missionID, mission] of this.missions) {
        missions[missionID] = mission.state;
    }

    return [
        scenarios,
        campaigns,
        chapters,
        missions
    ];
}

MissionManager.prototype.exit = function() { 
	this.currentScenario = null;
	this.currentCampaign = null;
	this.currentChapter = null;
	this.currentMission = null;
}