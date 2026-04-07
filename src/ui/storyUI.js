import { TextStyle } from "../../engine/graphics/textStyle.js";
import { toCenter } from "../../engine/math/math.js";
import { UIContext } from "../../engine/ui/uiContext.js";
import { MAX_CHAPTERS } from "../mission/constants.js";
import { UIData } from "./uiData.js";

export const StoryUI = function(gameContext) {
    UIContext.call(this);

    this.style = new TextStyle();
    this.gameContext = gameContext;

    this.style.font = "16px Times New Roman";
    this.style.setAlignment(TextStyle.ALIGN.MIDDLE);
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
    const { context } = display;
    const mainMenuBorder = uiData.getTexture(UIData.TEXTURE.STORY_MAIN_MENU_BORDER);
    const chapterPanel = uiData.getTexture(UIData.TEXTURE.STORY_CHAPTER_PANEL);
    const missionPanel = uiData.getTexture(UIData.TEXTURE.STORY_MISSION_PANEL);
    const titlePanel = uiData.getTexture(UIData.TEXTURE.STORY_TITLE_PANEL);
    const chapterPlaque = uiData.getTexture(UIData.TEXTURE.PLAQUE);
    const chapterPlaqueDisabled = uiData.getTexture(UIData.TEXTURE.PLAQUE_DISABLED);

    const borderX = toCenter(width, mainMenuBorder.width);
    const borderY = toCenter(height, mainMenuBorder.height);
    const panelX = borderX + 100;
    const panelY = borderY + 105;
    const missionPanelX = borderX + toCenter(mainMenuBorder.width, missionPanel.width);
    const missionPanelY = borderY + toCenter(mainMenuBorder.height, missionPanel.height);
    const titleX = borderX + toCenter(mainMenuBorder.width, titlePanel.width);
    const titleY = borderY - 20;

    context.fillStyle = "#eeeeee";
    context.fillRect(borderX, borderY, mainMenuBorder.width, mainMenuBorder.height);

    mainMenuBorder.draw(display, borderX, borderY);
    chapterPanel.draw(display, panelX, panelY);

    this.style.apply(context);

    const offsetY = chapterPlaque.height + 2;
    const plaqueX = panelX + toCenter(chapterPanel.width, chapterPlaque.width);
    const plaqueY = panelY + 11;

    if(currentCampaign) {
        const { chapters } = currentCampaign;
        const nextIndex = currentCampaign.getNextChapterIndex();
        const textX = plaqueX + Math.floor(chapterPlaque.width / 2);
        const textY = Math.floor(chapterPlaque.height / 2);

        for(let i = 0; i <= nextIndex; i++) {
            const drawY = plaqueY + offsetY * i;

            chapterPlaque.draw(display, plaqueX, drawY);
            context.fillText(`Chapter ${i + 1}`, textX, drawY + textY);
        }

        for(let i = nextIndex + 1; i < chapters.length; i++) {
            const drawY = plaqueY + offsetY * i;

            chapterPlaqueDisabled.draw(display, plaqueX, drawY);
            context.fillText(`Chapter ${i + 1}`, textX, drawY + textY);
        }
    }

    //Draw individual chapters.
    //Max chapters is always 7, but only draw up to how many the currentCampaign has.
    //usually there is a currentChapter but if there isnt then just do not display anything

    missionPanel.draw(display, missionPanelX, missionPanelY);
    titlePanel.draw(display, titleX, titleY);
}