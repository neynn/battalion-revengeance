import { TextStyle } from "../../../engine/graphics/textStyle.js";
import { toCenter } from "../../../engine/math/math.js";
import { IM_FLAG, UIContext } from "../../../engine/ui/uiContext.js";
import { createStartTurnIntent } from "../../action/actionHelper.js";
import { TeamOverride } from "../../map/override.js";
import { createClientMapLoader } from "../../systems/map.js";
import { mRegenerateLines } from "../helpers.js";
import { UI_TEXTURE } from "../constants.js";

const START_BUTTON_WIDTH = 391;
const START_BUTTON_HEIGHT = 101;

const EMBLEM_GAP = 20;
const EMBLEM_WIDTH = 70;
const EMBLEM_HEIGHT = 70;

const CHAPTER_ID_REGION = 100;
const MISSION_ID_REGION = 200;

const START_BUTTON = {
    DISABLED: 0,
    ENABLED: 1,
    HOT: 2
};

export const StoryUI = function() {
    UIContext.call(this);

    this.isImmediate = true;
    this.lines = [];
    this.lastMission = null;

    this.style = new TextStyle();
    this.style.font = "16px Times New Roman";
    this.style.setAlignment(TextStyle.ALIGN.MIDDLE);
}

StoryUI.prototype = Object.create(UIContext.prototype);
StoryUI.prototype.constructor = StoryUI;

StoryUI.prototype.load = function(gameContext) {
    const { uiData, uiManager } = gameContext;

    uiData.loadStoryTextures();
    uiManager.addContext(this);
}

StoryUI.prototype.onImmediate = function(gameContext, display) {
    const { uiData, applicationWindow, missionManager, typeRegistry, language } = gameContext;
    const { currentChapter, currentMission, currentCampaign } = missionManager;
    const { width, height } = applicationWindow;
    const { context } = display;
    const mainMenuBorder = uiData.getTexture(UI_TEXTURE.STORY_MAIN_MENU_BORDER);
    const chapterPanel = uiData.getTexture(UI_TEXTURE.STORY_CHAPTER_PANEL);
    const missionPanel = uiData.getTexture(UI_TEXTURE.STORY_MISSION_PANEL);
    const titlePanel = uiData.getTexture(UI_TEXTURE.STORY_TITLE_PANEL);
    const chapterPlaque = uiData.getTexture(UI_TEXTURE.PLAQUE);
    const chapterPlaqueDisabled = uiData.getTexture(UI_TEXTURE.PLAQUE_DISABLED);
    const emblemTexture = uiData.getTexture(UI_TEXTURE.STORY_EMBLEMS);
    const emblemSlot = uiData.getTexture(UI_TEXTURE.STORY_EMBLEM_SLOT);
    const startButtonTexture = uiData.getTexture(UI_TEXTURE.STORY_START);

    const borderX = toCenter(width, mainMenuBorder.width);
    const borderY = toCenter(height, mainMenuBorder.height);
    const chapterPanelX = borderX + 100;
    const chapterPanelY = borderY + 105;
    const missionPanelX = borderX + toCenter(mainMenuBorder.width, missionPanel.width);
    const missionPanelY = borderY + toCenter(mainMenuBorder.height, missionPanel.height);
    const PLAQUE_WIDTH = chapterPlaque.width;
    const PLAQUE_HEIGHT = chapterPlaque.height;

    context.fillStyle = "#eeeeee";
    context.fillRect(borderX, borderY, mainMenuBorder.width, mainMenuBorder.height);

    this.style.apply(context);

    mainMenuBorder.draw(display, borderX, borderY);
    chapterPanel.draw(display, chapterPanelX, chapterPanelY);
    missionPanel.draw(display, missionPanelX, missionPanelY);

    if(currentCampaign) {
        const { chapters, nation, startButton } = currentCampaign;
        const { emblem, nonEmblem } = typeRegistry.getNationType(nation);

        const plaqueX = chapterPanelX + toCenter(chapterPanel.width, PLAQUE_WIDTH);
        const plaqueY = chapterPanelY + 11;
        const offsetY = PLAQUE_HEIGHT + 2;
        const nextIndex = currentCampaign.getNextChapterIndex();

        for(let i = 0; i < chapters.length; i++) {
            const drawY = plaqueY + offsetY * i;

            if(i <= nextIndex) {
                chapterPlaque.draw(display, plaqueX, drawY);
                
                if(this.doButton(
                    gameContext,
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
            const { missions, name } = currentChapter;
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
                const { id, name, desc, map, playlist } = currentMission;
                const missionPanelTextX = Math.floor(missionPanelX + missionPanel.width / 2);
                const missionPanelTextY = missionPanelY + 32;

                const index = currentChapter.getMissionIndex(currentMission.id);
                const drawX = emblemX + (EMBLEM_WIDTH + EMBLEM_GAP) * index - 16;

                emblemSlot.draw(display, drawX, emblemY - 22);
                context.fillText(language.getSystemTranslation(name), missionPanelTextX, missionPanelTextY);

                if(this.lastMission !== id) {
                    this.lastMission = id;
                    this.lines.length = 0;

                    mRegenerateLines(this.lines, context, language.getSystemTranslation(desc), 480);
                }

                for(let i = 0; i < this.lines.length; i++) {
                    const textY = missionPanelTextY + 40 + 20 * i;

                    context.fillText(this.lines[i], missionPanelTextX, textY);
                }

                const startX = missionPanelX + toCenter(missionPanel.width, START_BUTTON_WIDTH);
                const startY = missionPanelY + missionPanel.height - Math.floor(START_BUTTON_HEIGHT / 2);
                const startTextX = startX + Math.floor(START_BUTTON_WIDTH / 2);
                const startTextY = startY + Math.floor(START_BUTTON_HEIGHT / 2);
                const startFlags = this.doButton(
                    gameContext,
                    2,
                    startX,
                    startY,
                    START_BUTTON_WIDTH,
                    START_BUTTON_HEIGHT
                );

                if(startFlags & IM_FLAG.HOT) {
                    startButtonTexture.drawRegion(display, START_BUTTON.HOT, startX, startY);
                } else {
                    startButtonTexture.drawRegion(display, START_BUTTON.ENABLED, startX, startY);
                }

                context.fillText(language.getSystemTranslation(startButton), startTextX, startTextY);

                if(startFlags & IM_FLAG.CLICKED) {
                    createClientMapLoader(gameContext, map)
                    .then(loader => {
                        if(loader) {
                            const { actionRouter } = gameContext;
                            const over = new TeamOverride("SOMERTIN");

                            over.color = {
                                "0x661A5E": [105, 125, 108],
                                "0xAA162C": [197, 171, 159],
                                "0xE9332E": [66, 65, 68],
                                "0xFF9085": [71, 75, 136]
                            };

                            //Hacky: Overrides the playlist to the missions.
                            if(playlist !== null) {
                                loader.playlist = playlist;
                            }

                            loader.loadMapFromFile(gameContext, [over]);
                            actionRouter.forceEnqueue(gameContext, createStartTurnIntent());
                            this.hide();
                        } else {
                            
                        }
                    });
                }
            }

            for(let i = 0; i < missions.length; i++) {
                const drawX = emblemX + (EMBLEM_WIDTH + EMBLEM_GAP) * i;

                if(i <= nextIndex) {
                    emblemTexture.drawRegion(display, emblem, drawX, emblemY);

                    if(this.doButton(
                        gameContext,
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