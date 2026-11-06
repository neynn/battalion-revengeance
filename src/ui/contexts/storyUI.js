import { TextStyle } from "../../../engine/graphics/textStyle.js";
import { toCenter } from "../../../engine/math/math.js";
import { IM_FLAG, UIContext } from "../../../engine/ui/uiContext.js";
import { TeamOverride } from "../../team/override.js";
import { MapSystem } from "../../systems/map.js";
import { mRegenerateLines } from "../helpers.js";
import { START_BUTTON_STYLE, UI_TEXTURE } from "../constants.js";
import { TextureRegion } from "../../../engine/resources/texture/textureRegion.js";
import { INTERRUPT_TYPE } from "../../enums.js";
import { InterruptVTable } from "../../action/types/interrupt.js";
import { drawTexture, drawTextureQuad, drawTextureRegion } from "../../../engine/renderer/textureHelpers.js";
import { Texture } from "../../../engine/resources/texture/texture.js";

const DO_SAVED = false;
const DATA = {};

const EMBLEM_GAP = 20;
const EMBLEM_WIDTH = 70;
const EMBLEM_HEIGHT = 70;

const CHAPTER_ID_REGION = 100;
const MISSION_ID_REGION = 200;
const DIFFICULTY_ID_REGION = 300;

export const StoryUI = function() {
    UIContext.call(this);

    this.doImmediate = true;
    this.lines = [];
    this.lastMission = null;

    this.style = new TextStyle();
    this.style.font = "16px Times New Roman";
    this.style.setAlignment(TextStyle.ALIGN.MIDDLE);

    this.difficultyRect = Texture.EMPTY_REGION;
    this.difficultyEasyRect = Texture.EMPTY_REGION;
    this.difficultyMediumRect = Texture.EMPTY_REGION;
    this.difficultyHardRect = Texture.EMPTY_REGION;
    this.hotseatRect = Texture.EMPTY_REGION;
    this.titleRect = Texture.EMPTY_REGION;
    this.specificationRect = Texture.EMPTY_REGION;
}

StoryUI.prototype = Object.create(UIContext.prototype);
StoryUI.prototype.constructor = StoryUI;

StoryUI.prototype.load = function(gameContext) {
    const { uiData, uiManager } = gameContext;
    const panelTexture = uiData.getTexture(UI_TEXTURE.STORY_PANELS);

    this.difficultyRect = panelTexture.getRegionByNameWithFallback("difficulty");
    this.hotseatRect = panelTexture.getRegionByNameWithFallback("hotseat");
    this.titleRect = panelTexture.getRegionByNameWithFallback("title");
    this.specificationRect = panelTexture.getRegionByNameWithFallback("specification");
    this.difficultyEasyRect = panelTexture.getRegionByNameWithFallback("difficulty_easy");
    this.difficultyMediumRect = panelTexture.getRegionByNameWithFallback("difficulty_medium");
    this.difficultyHardRect = panelTexture.getRegionByNameWithFallback("difficulty_hard");

    uiData.loadStoryTextures();
    uiManager.addContext(this);
}

StoryUI.prototype.onImmediate = function(gameContext, display) {
    const { uiData, gameWindow, missionManager, typeRegistry, language, scenarioRegistry } = gameContext;
    const { currentChapter, currentMission, currentCampaign } = missionManager;
    const { width, height } = gameWindow;
    const { context } = display;

    const mainMenuBorder = uiData.getTexture(UI_TEXTURE.STORY_MAIN_MENU_BORDER);
    const chapterPanel = uiData.getTexture(UI_TEXTURE.STORY_CHAPTER_PANEL);
    const chapterPlaque = uiData.getTexture(UI_TEXTURE.PLAQUE);
    const chapterPlaqueDisabled = uiData.getTexture(UI_TEXTURE.PLAQUE_DISABLED);
    const emblemTexture = uiData.getTexture(UI_TEXTURE.STORY_EMBLEMS);
    const emblemSlot = uiData.getTexture(UI_TEXTURE.STORY_EMBLEM_SLOT);
    const startButtonTexture = uiData.getTexture(UI_TEXTURE.STORY_START);
    const chapterArrowTexture = uiData.getTexture(UI_TEXTURE.ARROW);
    const missionPanel = uiData.getTexture(UI_TEXTURE.STORY_MISSION_PANEL);
    const panelTexture = uiData.getTexture(UI_TEXTURE.STORY_PANELS);
    
    const borderX = toCenter(width, mainMenuBorder.width);
    const borderY = toCenter(height, mainMenuBorder.height);
    const chapterPanelX = borderX + 100;
    const chapterPanelY = borderY + 100;
    const missionPanelX = borderX + toCenter(mainMenuBorder.width, missionPanel.width);
    const missionPanelY = borderY + toCenter(mainMenuBorder.height, missionPanel.height);
    const PLAQUE_WIDTH = chapterPlaque.width;
    const PLAQUE_HEIGHT = chapterPlaque.height;

    context.fillStyle = "#222222";
    context.fillRect(borderX, borderY, mainMenuBorder.width, mainMenuBorder.height);

    this.style.apply(context);

    drawTexture(mainMenuBorder, display, borderX, borderY);
    drawTexture(chapterPanel, display, chapterPanelX, chapterPanelY);
    drawTexture(missionPanel, display, missionPanelX, missionPanelY);

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
                drawTexture(chapterPlaque, display, plaqueX, drawY);
                
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
                drawTexture(chapterPlaqueDisabled, display, plaqueX, drawY);
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
            const titleX = borderX + toCenter(mainMenuBorder.width, this.titleRect.w);
            const titleY = borderY - 20;
            const titleTextX = Math.floor(titleX + this.titleRect.w / 2);
            const titleTextY = Math.floor(titleY + this.titleRect.h / 2);

            drawTextureQuad(panelTexture, this.titleRect, display, titleX, titleY);
            context.fillText(language.getSystemTranslation(name), titleTextX, titleTextY);

            //TODO: This is cursed.
            {
                const index = currentCampaign.getChapterIndex(currentChapter.id);
                const arrowX = plaqueX - 50;
                const arrowY = plaqueY + offsetY * index - PLAQUE_HEIGHT / 2;

                drawTexture(chapterArrowTexture, display, arrowX, arrowY);
            }

            if(currentMission) {
                const { id, name, desc, scenarioID } = currentMission;
                const missionPanelTextX = Math.floor(missionPanelX + missionPanel.width / 2);
                const missionPanelTextY = missionPanelY + 32;

                const index = currentChapter.getMissionIndex(currentMission.id);
                const drawX = emblemX + (EMBLEM_WIDTH + EMBLEM_GAP) * index - 16;

                drawTexture(emblemSlot, display, drawX, emblemY - 22);

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

                const startX = missionPanelX + toCenter(missionPanel.width, START_BUTTON_STYLE.width);
                const startY = missionPanelY + missionPanel.height - START_BUTTON_STYLE.halfHeight;
                const startTextX = startX + START_BUTTON_STYLE.halfWidth;
                const startTextY = startY + START_BUTTON_STYLE.halfHeight;
                const startFlags = this.doButton(
                    gameContext,
                    2,
                    startX,
                    startY,
                    START_BUTTON_STYLE.width,
                    START_BUTTON_STYLE.height
                );

                if(startFlags & IM_FLAG.HOT) {
                    drawTextureRegion(startButtonTexture, START_BUTTON_STYLE.hot, display, startX, startY);
                } else {
                    drawTextureRegion(startButtonTexture, START_BUTTON_STYLE.enabled, display, startX, startY);
                }

                context.fillText(language.getSystemTranslation(startButton), startTextX, startTextY);

                if(startFlags & IM_FLAG.CLICKED) {
                    const override1 = new TeamOverride();

                    override1.team = 0;
                    override1.color = {
                        "0x661A5E": [105, 125, 108],
                        "0xAA162C": [197, 171, 159],
                        "0xE9332E": [66, 65, 68],
                        "0xFF9085": [71, 75, 136]
                    };

                    if(DO_SAVED) {
                        const loader = MapSystem.createClientLoader(gameContext, DATA.scenario);

                        if(loader) {
                            loader.createSavedMatch(gameContext, DATA, []);
                            this.hide();
                        }
                    } else {
                        const loader = MapSystem.createClientLoader(gameContext, scenarioID);

                        if(loader) {
                            const { actionRouter } = gameContext;

                            loader.createDefaultMatch(gameContext, []);
                            //isTrigger does not matter here because it's story based. isMultiplayer is false anyway.
                            actionRouter.pushIntent(gameContext, InterruptVTable.createIntent(INTERRUPT_TYPE.START_GAME, -1));

                            this.hide();
                        } else {
                            //TODO(neyn): Log error.
                        }
                    }
                }
            }

            for(let i = 0; i < missions.length; i++) {
                const drawX = emblemX + (EMBLEM_WIDTH + EMBLEM_GAP) * i;

                if(i <= nextIndex) {
                    drawTextureRegion(emblemTexture, emblem, display, drawX, emblemY);

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
                    drawTextureRegion(emblemTexture, nonEmblem, display, drawX, emblemY);
                }
            }

            const panelX = borderX + mainMenuBorder.width - this.specificationRect.w - 50;
            const panelY = borderY + mainMenuBorder.height - this.specificationRect.h - 50;

            drawTextureQuad(panelTexture, this.specificationRect, display, panelX, panelY);

            const hotseatX = chapterPanelX + toCenter(chapterPanel.width, this.hotseatRect.w);
            const hotseatY = chapterPanelY + chapterPanel.height + 2;

            drawTextureQuad(panelTexture, this.hotseatRect, display, hotseatX, hotseatY);

            const difficultyX = chapterPanelX + toCenter(chapterPanel.width, this.difficultyRect.w);
            const difficultyY = hotseatY + this.hotseatRect.h + 4;

            this.drawDifficulty(gameContext, display, difficultyX, difficultyY);
        }
    }
}

StoryUI.prototype.drawDifficulty = function(gameContext, display, screenX, screenY) {
    const { uiData, language } = gameContext;
    const { context } = display;
    const panelTexture = uiData.getTexture(UI_TEXTURE.STORY_PANELS);

    const difficultyX = screenX + 15;
    const easyY = screenY + 40;
    const mediumY = easyY + this.difficultyEasyRect.h + 5;
    const hardY = mediumY + this.difficultyMediumRect.h + 5;

    const textX = screenX + Math.floor(this.difficultyRect.w / 2);
    const textY = screenY + 25;
    const textOffsetX = 15;
    const textOffsetY = Math.floor(this.difficultyEasyRect.h / 2);

    drawTextureQuad(panelTexture, this.difficultyRect, display, screenX, screenY);
    drawTextureQuad(panelTexture, this.difficultyEasyRect, display, difficultyX, easyY);
    drawTextureQuad(panelTexture, this.difficultyMediumRect, display, difficultyX, mediumY);
    drawTextureQuad(panelTexture, this.difficultyHardRect, display, difficultyX, hardY);

    context.fillText(language.getSystemTranslation("STORY_DIFFICULTY_TITLE"), textX, textY);
    context.fillText(language.getSystemTranslation("STORY_DIFFICULTY_EASY"), textX + textOffsetX, easyY + textOffsetY);
    context.fillText(language.getSystemTranslation("STORY_DIFFICULTY_MEDIUM"), textX + textOffsetX, mediumY + textOffsetY);
    context.fillText(language.getSystemTranslation("STORY_DIFFICULTY_HARD"), textX + textOffsetX, hardY + textOffsetY);

    const easyID = DIFFICULTY_ID_REGION;
    const mediumID = DIFFICULTY_ID_REGION + 1;
    const hardID = DIFFICULTY_ID_REGION + 2;

    if(this.doButton(
        gameContext,
        easyID, 
        screenX,
        easyY,
        this.difficultyRect.w,
        this.difficultyEasyRect.h
    ) & IM_FLAG.CLICKED) {
        console.log("EASY_MODE!");
    }

    if(this.doButton(
        gameContext,
        mediumID,
        screenX,
        mediumY,
        this.difficultyRect.w,
        this.difficultyMediumRect.h
    ) & IM_FLAG.CLICKED) {
        console.log("MEDIUM_MODE!");
    }

    if(this.doButton(
        gameContext,
        hardID,
        screenX,
        hardY,
        this.difficultyRect.w,
        this.difficultyHardRect.h
    ) & IM_FLAG.CLICKED) {
        console.log("HARD_MODE!");
    }
}