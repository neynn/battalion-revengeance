import { toCenter } from "../../engine/math/math.js";
import { UIContext } from "../../engine/ui/uiContext.js";
import { MAX_CHAPTERS } from "../mission/constants.js";
import { UIData } from "./uiData.js";

export const StoryUI = function(gameContext) {
    UIContext.call(this);

    this.gameContext = gameContext;
}

StoryUI.prototype = Object.create(UIContext.prototype);
StoryUI.prototype.constructor = StoryUI;

StoryUI.prototype.load = function() {
    const { uiData, uiManager } = this.gameContext;

    uiData.loadStoryTextures();
    uiManager.addContext(this);
}

StoryUI.prototype.onDraw = function(display, screenX, screenY) {
    const { uiData, applicationWindow, missionManager } = this.gameContext;
    const { currentChapter, currentMission, currentCampaign } = missionManager;
    const { width, height } = applicationWindow;
    const mainMenuBorder = uiData.getTexture(UIData.TEXTURE.STORY_MAIN_MENU_BORDER);
    const chapterPanel = uiData.getTexture(UIData.TEXTURE.STORY_CHAPTER_PANEL);
    const missionPanel = uiData.getTexture(UIData.TEXTURE.STORY_MISSION_PANEL);
    const titlePanel = uiData.getTexture(UIData.TEXTURE.STORY_TITLE_PANEL);
    const chapterPlaque = uiData.getTexture(UIData.TEXTURE.STORY_CHAPTER_PLAQUE);

    const borderX = toCenter(width, mainMenuBorder.width);
    const borderY = toCenter(height, mainMenuBorder.height);
    const panelX = borderX + 100;
    const panelY = borderY + 105;
    const missionPanelX = borderX + toCenter(mainMenuBorder.width, missionPanel.width);
    const missionPanelY = borderY + toCenter(mainMenuBorder.height, missionPanel.height);
    const titleX = borderX + toCenter(mainMenuBorder.width, titlePanel.width);
    const titleY = borderY - 20;

    display.context.fillStyle = "#eeeeee";
    display.context.fillRect(borderX, borderY, mainMenuBorder.width, mainMenuBorder.height);

    mainMenuBorder.draw(display, borderX, borderY);
    chapterPanel.draw(display, panelX, panelY);

    //Only if there is a current campaign selected, then draw the individual chapters
    //TODO MAX of 7 CHAPTERS!
    const offsetY = chapterPlaque.height + 2;
    const plaqueX = panelX + toCenter(chapterPanel.width, chapterPlaque.width);
    const plaqueY = panelY + 11;

    if(currentCampaign) {
        const { chapters } = currentCampaign;


        for(let i = 0; i < chapters.length; i++) {
            chapterPlaque.draw(display, plaqueX, plaqueY + offsetY * i);
        }
    }

    //Draw individual chapters.
    //Max chapters is always 7, but only draw up to how many the currentCampaign has.
    //usually there is a currentChapter but if there isnt then just do not display anything

    missionPanel.draw(display, missionPanelX, missionPanelY);
    titlePanel.draw(display, titleX, titleY);
}