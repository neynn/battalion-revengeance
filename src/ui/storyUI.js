import { TextStyle } from "../../engine/graphics/textStyle.js";
import { toCenter } from "../../engine/math/math.js";
import { IM_FLAG, UIContext } from "../../engine/ui/uiContext.js";
import { MAX_CHAPTERS } from "../mission/constants.js";
import { mRegenerateLines } from "./helpers.js";
import { UIData } from "./uiData.js";

const EMBLEM_GAP = 20;
const EMBLEM_WIDTH = 70;
const EMBLEM_HEIGHT = 70;

const CHAPTER_ID_REGION = 100;
const MISSION_ID_REGION = 200;

export const StoryUI = function(gameContext) {
    UIContext.call(this);

    this.style = new TextStyle();
    this.gameContext = gameContext;

    this.style.font = "16px Times New Roman";
    this.style.setAlignment(TextStyle.ALIGN.MIDDLE);
    this.lines = [];
    this.lastDescription = null;
}

StoryUI.prototype = Object.create(UIContext.prototype);
StoryUI.prototype.constructor = StoryUI;

StoryUI.prototype.load = function() {
    const { uiData, uiManager } = this.gameContext;

    uiData.loadStoryTextures();
    uiManager.addContext(this);
}

StoryUI.prototype.onDraw = function(display, screenX, screenY) {
    const { uiData, applicationWindow, missionManager, typeRegistry, language } = this.gameContext;
    const { currentChapter, currentMission, currentCampaign } = missionManager;
    const { width, height } = applicationWindow;
    const { context } = display;
    const mainMenuBorder = uiData.getTexture(UIData.TEXTURE.STORY_MAIN_MENU_BORDER);
    const chapterPanel = uiData.getTexture(UIData.TEXTURE.STORY_CHAPTER_PANEL);
    const missionPanel = uiData.getTexture(UIData.TEXTURE.STORY_MISSION_PANEL);
    const titlePanel = uiData.getTexture(UIData.TEXTURE.STORY_TITLE_PANEL);
    const chapterPlaque = uiData.getTexture(UIData.TEXTURE.PLAQUE);
    const chapterPlaqueDisabled = uiData.getTexture(UIData.TEXTURE.PLAQUE_DISABLED);
    const emblemTexture = uiData.getTexture(UIData.TEXTURE.STORY_EMBLEMS);
    const emblemSlot = uiData.getTexture(UIData.TEXTURE.STORY_EMBLEM_SLOT);

    const borderX = toCenter(width, mainMenuBorder.width);
    const borderY = toCenter(height, mainMenuBorder.height);
    const panelX = borderX + 100;
    const panelY = borderY + 105;
    const missionPanelX = borderX + toCenter(mainMenuBorder.width, missionPanel.width);
    const missionPanelY = borderY + toCenter(mainMenuBorder.height, missionPanel.height);
    const PLAQUE_WIDTH = chapterPlaque.width;
    const PLAQUE_HEIGHT = chapterPlaque.height;

    context.fillStyle = "#eeeeee";
    context.fillRect(borderX, borderY, mainMenuBorder.width, mainMenuBorder.height);

    this.style.apply(context);

    mainMenuBorder.draw(display, borderX, borderY);
    chapterPanel.draw(display, panelX, panelY);
    missionPanel.draw(display, missionPanelX, missionPanelY);

    if(currentCampaign) {
        const { chapters, nation } = currentCampaign;
        const { emblem, nonEmblem } = typeRegistry.getNationType(nation);

        const plaqueX = panelX + toCenter(chapterPanel.width, PLAQUE_WIDTH);
        const plaqueY = panelY + 11;
        const offsetY = PLAQUE_HEIGHT + 2;
        const nextIndex = currentCampaign.getNextChapterIndex();

        for(let i = 0; i < chapters.length; i++) {
            const drawY = plaqueY + offsetY * i;

            if(i <= nextIndex) {
                chapterPlaque.draw(display, plaqueX, drawY);
                
                if(this.doButton(
                    this.gameContext,
                    CHAPTER_ID_REGION + i,
                    plaqueX,
                    drawY,
                    PLAQUE_WIDTH,
                    PLAQUE_HEIGHT
                ) & IM_FLAG.CLICKED) {
                    missionManager.selectChapterIfPossible(i);
                    missionManager.selectMissionIfPossible(missionManager.getNextMissionIndex());
                }
            } else {
                chapterPlaqueDisabled.draw(display, plaqueX, drawY);
            }
            
            const textX = plaqueX + Math.floor(PLAQUE_WIDTH / 2);
            const textY = Math.floor(PLAQUE_HEIGHT / 2);
            const chapterName = language.getSystemTranslation("STORY_CHAPTER_PLAQUE");

            context.fillText(chapterName + ` ${i + 1}`, textX, drawY + textY);
        }

        if(currentChapter) {
            const { missions, name, desc } = currentChapter;
            const totalEmblemWidth = EMBLEM_WIDTH * missions.length + EMBLEM_GAP * (missions.length - 1);
            const emblemX = missionPanelX + toCenter(missionPanel.width, totalEmblemWidth);
            const emblemY = missionPanelY - EMBLEM_HEIGHT;
            const nextIndex = currentChapter.getNextMissionIndex();

            //Draw title
            {
                const titleX = borderX + toCenter(mainMenuBorder.width, titlePanel.width);
                const titleY = borderY - 20;
                const titleTextX = Math.floor(titleX + titlePanel.width / 2);
                const titleTextY = Math.floor(titleY + titlePanel.height / 2);

                titlePanel.draw(display, titleX, titleY);
                context.fillText(language.getSystemTranslation(name), titleTextX, titleTextY);
            }

            //TODO: This is cursed.
            {
                const index = currentCampaign.getChapterIndex(currentChapter.id);

                context.fillRect(plaqueX - 10, plaqueY + offsetY * index, 10, PLAQUE_HEIGHT);
            }

            if(currentMission) {
                const { name, desc } = currentMission;
                const missionPanelTextX = Math.floor(missionPanelX + missionPanel.width / 2);
                const missionPanelTextY = missionPanelY + 32;

                const index = currentChapter.getMissionIndex(currentMission.id);
                const drawX = emblemX + (EMBLEM_WIDTH + EMBLEM_GAP) * index - 16;

                emblemSlot.draw(display, drawX, emblemY - 22);
                context.fillText(language.getSystemTranslation(name), missionPanelTextX, missionPanelTextY);

                if(this.lastDescription !== desc) {
                    this.lines.length = 0;
                    this.lastDescription = desc;

                    mRegenerateLines(this.lines, context, language.getSystemTranslation(desc), 480);
                }

                for(let i = 0; i < this.lines.length; i++) {
                    const textY = missionPanelTextY + 40 + 20 * i;

                    context.fillText(this.lines[i], missionPanelTextX, textY);
                }
            }

            for(let i = 0; i < missions.length; i++) {
                const drawX = emblemX + (EMBLEM_WIDTH + EMBLEM_GAP) * i;

                if(i <= nextIndex) {
                    emblemTexture.drawRegion(display, emblem, drawX, emblemY);

                    if(this.doButton(
                        this.gameContext,
                        MISSION_ID_REGION + i,
                        drawX,
                        emblemY,
                        EMBLEM_WIDTH,
                        EMBLEM_HEIGHT
                    ) & IM_FLAG.CLICKED) {
                        missionManager.selectMissionIfPossible(i);
                    }
                } else {
                    emblemTexture.drawRegion(display, nonEmblem, drawX, emblemY);
                }
            }
        }
    }
}