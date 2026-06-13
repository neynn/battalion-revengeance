import { TextStyle } from "../../../engine/graphics/textStyle.js";
import { toCenter } from "../../../engine/math/math.js";
import { SpriteManager } from "../../../engine/sprite/spriteManager.js";
import { IM_FLAG, UIContext } from "../../../engine/ui/uiContext.js";
import { MapInspector } from "../../map/mapInspector.js";
import { getHealthColor } from "../../entity/helpers.js";
import { DIRECTION, TILE_ID } from "../../enums.js";
import { UI_TEXTURE, HUD_BUTTON, GENERIC_BUTTON_STYLE, HUD_BUTTON_STYLE } from "../constants.js";
import { BattalionMap } from "../../map/battalionMap.js";
import { isDrawTime, mRegenerateLines } from "../helpers.js";
import { ActorManager } from "../../../engine/world/actor/actorManager.js";
import { EndTurnVTable } from "../../action/types/endTurn.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { CameraContext } from "../../../engine/renderer/cameraContext.js";
import { TeamManager } from "../../team/teamManager.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";

const PORTRAIT_WIDTH = 130;
const PORTRAIT_HEIGHT = 150;

const MENU_ID_REGION = 100;
const ICON_ID_REGION = 200;
const DIALOGUE_ID_REGION = 300;

const DIALOGUE_BOX_WIDTH = 560;
const DIALOGUE_BOX_HEIGHT = 150;
const RECON_TOOLTIP_BOX_WIDTH = 154;
const RECON_TOOLTIP_WIDTH = 160;
const RECON_TOOLTIP_MINI_HEIGHT = 32;
const RECON_TOOLTIP_HEIGHT = 42;
const RECON_TOOLTIP_PLUS_HEIGHT = 56;
const RECON_VITALITY_HEALTH_WIDTH = 33;
const RECON_VITALITY_HEALTH_HEIGHT = 6;
const DESCRIPTION_BOX_WIDTH_TILE_VANILLA = 421;
const DESCRIPTION_BOX_WIDTH_TILE = 381;
const DESCRIPTION_BOX_WIDTH_ENTITY = 215;

const ICON_WIDTH = 20;
const ICON_HEIGHT = 20;

const RECON_MAIN_WIDTH = 154;
const RECON_BAR_HEIGHT = 42;

const TILE_DRAW_ORDER = [
    BattalionMap.LAYER.GROUND,
    BattalionMap.LAYER.DECORATION,
    BattalionMap.LAYER.CLOUD
];

const LineCache = function() {
    this.reconLineTime = 0;
    this.reconLineIndex = 0;
    this.reconLines = [];
    this.tooltipLines = [];
    this.dialogueLines = [];
    this.lastTooltip = null;
}

LineCache.prototype.resetRecon = function() {
    this.reconLines.length = 0;
    this.reconLineTime = 0;
    this.reconLineIndex = 0;
}

LineCache.prototype.updateRecon = function(context, text, maxWidth) {
    this.resetRecon();
    mRegenerateLines(this.reconLines, context, text, maxWidth);
}

LineCache.prototype.tryUpdateTooltip = function(languageHandler, context, tooltip) {
    if(this.lastTooltip !== tooltip) {
        this.tooltipLines.length = 0;
        this.lastTooltip = tooltip;

        if(tooltip.length !== 0) {
            const text = languageHandler.getSystemTranslation(tooltip);

            mRegenerateLines(this.tooltipLines, context, text, RECON_TOOLTIP_BOX_WIDTH);
        }
    }
}

LineCache.prototype.tryUpdateDialogue = function(dialogueHandler, context) {
    const { fullText } = dialogueHandler;

    if(dialogueHandler.hasEntryChanged()) {
        this.dialogueLines.length = 0;

        let charCount = 0;

        mRegenerateLines(this.dialogueLines, context, fullText, 418);

        for(let i = 0; i < this.dialogueLines.length; i++) {
            charCount += this.dialogueLines[i].length;
        }

        dialogueHandler.setLetterCount(charCount);
    }
}

LineCache.prototype.resetDialogue = function() {
    this.dialogueLines.length = 0;
}

LineCache.prototype.updateReconIndex = function(deltaTime) {
    if(this.reconLines.length > 2) {
        const SECONDS_PER_LINE = 2;
        const frameIndex = Math.floor(this.reconLineTime / SECONDS_PER_LINE) % this.reconLines.length;

        this.reconLineIndex = frameIndex;
        this.reconLineTime += deltaTime;
    }
}

LineCache.prototype.drawRecon = function(context, reconX, reconY, deltaTime) {
    if(this.reconLines.length !== 0) {
        context.fillStyle = "#ffffff";
        context.fillText(this.reconLines[this.reconLineIndex], reconX + 39, reconY);

        //Always try to fit two lines into the box.
        if(this.reconLineIndex < this.reconLines.length - 1) {
            context.fillText(this.reconLines[this.reconLineIndex + 1], reconX + 39, reconY + 10);
        }
    }
}

/**
 * 
 * @param {CameraContext} cameraContext 
 */
export const PlayUI = function(cameraContext) {
    UIContext.call(this);

    this.doImmediate = true;
    this.cameraContext = cameraContext;
    this.inspector = new MapInspector();
    this.inspectSprite = SpriteManager.EMPTY_SPRITE;

    this.style = new TextStyle();
    this.style.baseline = TextStyle.BASELINE.TOP;
    this.style.font = "10px arial";

    this.lastIndex = -1;
    this.lastEntityID = EntityManager.INVALID_ID;
    this.lastEntityTypeID = -1;

    this.iconTick = 0;
    this.lineCache = new LineCache();
}

PlayUI.prototype = Object.create(UIContext.prototype);
PlayUI.prototype.constructor = PlayUI;

PlayUI.prototype.getHudTitle = function(gameContext) {
    const { language, missionManager, world } = gameContext;
    const { mapManager } = world;
    const { currentMission } = missionManager;

    if(!currentMission) {
        const worldMap = mapManager.getActiveMap();
        
        return worldMap.name;
    }

    return language.getSystemTranslation(currentMission.name);
}

PlayUI.prototype.load = function(gameContext) {
    const { uiData, uiManager, spriteManager } = gameContext;

    this.inspectSprite = spriteManager.createEmptySprite();
    this.inspectSprite.scale = 0.6;

    uiData.loadGenericTextures();
    uiData.loadPlayTextures();
    uiManager.addContext(this);
}

//TODO(neyn): Create a 28x28 ICON for each entity!
//This icon gets drawn instead of a full sprite!
PlayUI.prototype.updateInspectSprite = function(gameContext, entity) {
    const { spriteManager, spriteController } = gameContext;
    const { color } = entity.getTeam(gameContext);
    const spriteTypeID = spriteController.getEntitySpriteTypeID(entity.config.id, BattalionEntity.STATE.IDLE, DIRECTION.EAST);

    spriteManager.updateSprite(this.inspectSprite.index, spriteTypeID, color);
}

PlayUI.prototype.drawTile = function(gameContext, display, tileX, tileY, screenX, screenY) {
    const { tileManager, world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const { context } = display;

    for(const layerID of TILE_DRAW_ORDER) {
        const tileID = worldMap.getTile(layerID, tileX, tileY);

        if(tileID > TILE_ID.NONE) {
            this.cameraContext.renderer.drawTile(tileManager, tileID, context, screenX + 4, screenY + 11, 0.5);
        }
    }
}

PlayUI.prototype.drawIcon = function(gameContext, iconID, display, screenX, screenY) {
    const { uiData } = gameContext;
    const iconTick = this.iconTick++;
    const flags = this.doIcon(gameContext, ICON_ID_REGION + iconTick, screenX, screenY, ICON_WIDTH, ICON_HEIGHT);
    let isCollided = false;

    uiData.getTexture(UI_TEXTURE.ICONS).drawRegion(display, iconID, screenX, screenY);

    if(flags & IM_FLAG.HOT) {
        const { context } = display;

        context.fillStyle = "#eeeeee";
        context.globalAlpha = 0.2;
        context.fillRect(screenX, screenY, ICON_WIDTH, ICON_HEIGHT);
        context.globalAlpha = 1;

        isCollided = true;
    }

    return isCollided;
}

PlayUI.prototype.drawMainHud = function(gameContext, display, screenX, screenY) {
    const { client, world, uiData, language, teamManager, typeRegistry } = gameContext;
    const { session } = client; 
    const { actorManager } = world;
    const { activeTeams, currentIndex } = teamManager;
    const { context } = display;
    const buttonTexture = uiData.getTexture(UI_TEXTURE.HUD_BUTTONS);
    const hudTexture = uiData.getTexture(UI_TEXTURE.RECON_MAIN);
    const genericButtonTexture = uiData.getTexture(UI_TEXTURE.GENERIC_BUTTON);

    const mainX = screenX - 14;
    const mainY = screenY;
    const textX = mainX + 86;
    const textY = mainY + 140;
    const buttonX = mainX + 33;
    const buttonY = mainY + 169;

    const undoID = MENU_ID_REGION;
    const menuID = MENU_ID_REGION + 1;
    const quitID = MENU_ID_REGION + 2;
    const endTurnID = MENU_ID_REGION + 3;
    const undoFlags = this.doButton(gameContext, undoID, buttonX, buttonY,  HUD_BUTTON_STYLE.width, HUD_BUTTON_STYLE.height);
    const menuFlags = this.doButton(gameContext, menuID, buttonX + 38, buttonY, HUD_BUTTON_STYLE.width, HUD_BUTTON_STYLE.height);
    const quitFlags = this.doButton(gameContext, quitID, buttonX + 76, buttonY, HUD_BUTTON_STYLE.width, HUD_BUTTON_STYLE.height);

    let undoButton = HUD_BUTTON.UNDO_ENABLED;
    let menuButton = HUD_BUTTON.MENU_ENABLED;
    let quitButton = HUD_BUTTON.QUIT_ENABLED;

    hudTexture.draw(display, mainX, mainY);
    context.textAlign = TextStyle.ALIGN.MIDDLE;

    switch(this.hotWidget) {
        case undoID: {
            undoButton = HUD_BUTTON.UNDO_HOT;
            context.fillText(language.getSystemTranslation("HUD_UNDO"), textX, textY);
            break;
        }
        case menuID: {
            menuButton = HUD_BUTTON.MENU_HOT;
            context.fillText(language.getSystemTranslation("HUD_MENU"), textX, textY);
            break;
        }
        case quitID: {
            quitButton = HUD_BUTTON.QUIT_HOT;
            context.fillText(language.getSystemTranslation("HUD_QUIT"), textX, textY);
            break;
        }
        default: {
            context.fillText(this.getHudTitle(gameContext), textX, textY);
            break;
        }
    }

    context.textAlign = TextStyle.ALIGN.LEFT;

    switch(this.activeWidget) {
        case undoID: {
            undoButton = HUD_BUTTON.UNDO_ACTIVE;
            break;
        }
        case menuID: {
            menuButton = HUD_BUTTON.MENU_ACTIVE;
            break;
        }
        case quitID: {
            quitButton = HUD_BUTTON.QUIT_ACTIVE;
            break;
        }
    }

    buttonTexture.drawRegion(display, undoButton, buttonX, buttonY);
    buttonTexture.drawRegion(display, menuButton, buttonX + 38, buttonY);
    buttonTexture.drawRegion(display, quitButton, buttonX + 76, buttonY);

    //Only up to 4 teams!
    const teamX = mainX + 3;
    const teamY = mainY + 389;
    const TEAM_OFFSET_Y = 30;
    const teamDraws = activeTeams.length > 4 ? 4 : activeTeams.length;
    const teamPlate = uiData.getTexture(UI_TEXTURE.HUD_GLASSPLATE);

    const colorX = teamX + 22;
    const COLOR_WIDTH = 129;
    const COLOR_HEIGHT = 19;

    //Always display 4 teams.
    for(let i = 0; i < teamDraws; i++) {
        const index = (currentIndex + i) % activeTeams.length;
        const team = teamManager.getTeam(activeTeams[index]);
        const nextY = teamY + TEAM_OFFSET_Y * i;
        const { hudColor, textColor } = typeRegistry.getColorType(team.color);

        context.fillStyle = hudColor;
        context.fillRect(colorX, nextY + 4, COLOR_WIDTH, COLOR_HEIGHT);

        teamPlate.draw(display, teamX, nextY);

        context.fillStyle = textColor;
        context.fillText(team.getDisplayName(gameContext), teamX + 28, nextY + 8);
    }

    const endturnX = mainX + toCenter(hudTexture.width, genericButtonTexture.width) + 8;
    const endTurnY = mainY + hudTexture.height - GENERIC_BUTTON_STYLE.height - 16;
    let button = GENERIC_BUTTON_STYLE.disabled;

    const endTurnFlags = this.doButton(
        gameContext,
        endTurnID,
        endturnX,
        endTurnY,
        GENERIC_BUTTON_STYLE.width,
        GENERIC_BUTTON_STYLE.height
    );

    const actor = actorManager.getActor(session.actorID);

    if(actor && teamManager.isCurrent(actor.teamID)) {
        if(endTurnFlags & IM_FLAG.CLICKED) {
            actor.addIntent(EndTurnVTable.createIntent());
        }

        if(endTurnFlags & IM_FLAG.ACTIVE) {
            button = GENERIC_BUTTON_STYLE.active;
        } else if(endTurnFlags & IM_FLAG.HOT) {
            button = GENERIC_BUTTON_STYLE.hot;
        } else {
            button = GENERIC_BUTTON_STYLE.enabled;
        }
    }

    genericButtonTexture.drawRegion(display, button, endturnX, endTurnY);
    context.textAlign = TextStyle.ALIGN.MIDDLE;
    context.fillStyle = this.style.color;
    context.fillText("END TURN", endturnX + GENERIC_BUTTON_STYLE.halfWidth, endTurnY + GENERIC_BUTTON_STYLE.halfHeight - 5);
    context.textAlign = TextStyle.ALIGN.LEFT;
}

PlayUI.prototype.drawDialogueHud = function(gameContext, display, screenX, screenY) {
    const { timer, uiData, dialogueHandler, typeRegistry, language } = gameContext;
    const { letterIndex } = dialogueHandler;
    const dialogue = dialogueHandler.getCurrentEntry();

    if(!dialogue) {
        this.inspector.enable();
        return;
    }

    this.inspector.disable();

    const nextTexture = uiData.getTexture(UI_TEXTURE.ARROW);
    const skipTexture = uiData.getTexture(UI_TEXTURE.DIALOGUE_SKIP);
    const boxTexture = uiData.getTexture(UI_TEXTURE.DIALOGUE_BOX);
    const portraitTexture = uiData.getTexture(UI_TEXTURE.STORY_PORTRAITS);

    const { context } = display;
    const { narrator } = dialogue;
    const { portrait, name } = typeRegistry.getCommanderType(narrator);
    const commanderName = language.getSystemTranslation(name);

    const barWidth = 4;
    const nextOffsetY = 8;
    const dialogueX = screenX - DIALOGUE_BOX_WIDTH;
    const dialogueY = screenY - DIALOGUE_BOX_HEIGHT;
    const skipX = screenX - skipTexture.width;
    const skipY = dialogueY - skipTexture.height;
    const nextX = screenX - nextTexture.width;
    const nextY = screenY - nextTexture.height + nextOffsetY;
    const textX = dialogueX + PORTRAIT_WIDTH + barWidth + 4;
    const textY = dialogueY + 4 + 22;

    context.font = "16px Times New Roman";
    context.textAlign = TextStyle.ALIGN.LEFT;

    this.lineCache.tryUpdateDialogue(dialogueHandler, context);
    
    let remainingChars = letterIndex;
    let fullLinesToDraw = 0;

    for(let i = 0; i < this.lineCache.dialogueLines.length; i++) {
        const lineLength =  this.lineCache.dialogueLines[i].length;
        const remaining = remainingChars - lineLength;

        if(remaining < 0) {
            break;
        }

        fullLinesToDraw++;
        remainingChars -= lineLength;
    }

    boxTexture.draw(display, dialogueX, dialogueY);
    skipTexture.draw(display, skipX, skipY);
    portraitTexture.drawRegion(display, portrait, dialogueX, dialogueY);

    context.fillStyle = "#ff0000";
    context.fillRect(dialogueX + PORTRAIT_WIDTH, dialogueY, barWidth, DIALOGUE_BOX_HEIGHT);
    context.fillStyle = this.style.color;
    context.fillText(commanderName, textX, dialogueY + 6);

    for(let i = 0; i < fullLinesToDraw; i++) {
        const drawY = textY + 20 * i;

        context.fillText(this.lineCache.dialogueLines[i], textX, drawY);
    }

    if(fullLinesToDraw < this.lineCache.dialogueLines.length) {
        const nextLine = this.lineCache.dialogueLines[fullLinesToDraw];
        const text = nextLine.substring(0, remainingChars);
        const drawY = textY + 20 * fullLinesToDraw;

        context.fillText(text, textX, drawY);
    } else if(fullLinesToDraw === this.lineCache.dialogueLines.length) {
        if(isDrawTime(timer.realTime, 2, 0.5)) {
            nextTexture.draw(display, nextX, nextY);
        }
    }

    const skipID = DIALOGUE_ID_REGION;
    const nextID = DIALOGUE_ID_REGION + 1;
    
    if(this.doButton(
        gameContext,
        nextID,
        nextX,
        nextY,
        nextTexture.width,
        nextTexture.height - nextOffsetY
    ) & IM_FLAG.CLICKED) {
        dialogueHandler.onNextButton(gameContext);
    }

    if(this.doButton(
        gameContext,
        skipID,
        skipX,
        skipY,
        skipTexture.width,
        skipTexture.height
    ) & IM_FLAG.CLICKED) {
        dialogueHandler.onSkipButton();

        this.lineCache.resetDialogue();
    }
}

PlayUI.prototype.updateEntityState = function(entity) {
    const entityID = entity.id;
    const typeID = entity.config.id;
    let hasChanged = false;

    if(this.lastEntityID !== entityID || this.lastEntityTypeID !== typeID) {
        this.lastEntityID = entityID;
        this.lastEntityTypeID = typeID;
        
        hasChanged = true;
    }

    return hasChanged;
}

PlayUI.prototype.onImmediate = function(gameContext, display) {
    const { uiData, world, language, timer, typeRegistry, gameWindow, spriteController } = gameContext;
    const { width, height } = gameWindow;
    const { mapManager } = world;
    const { realTime, deltaTime } = timer;
    const { context } = display;
    const tileX = this.inspector.lastX;
    const tileY = this.inspector.lastY;
    const worldMap = mapManager.getActiveMap();
    const index = worldMap.getIndex(tileX, tileY);

    const gameWidth = this.cameraContext.camera.viewportWidth + RECON_MAIN_WIDTH;
    const gameHeight = this.cameraContext.camera.viewportHeight + RECON_BAR_HEIGHT;
    const gameX = Math.floor((width - gameWidth) / 2);
    const gameY = Math.floor((height - gameHeight) / 2);

    this.cameraContext.setPosition(gameX, gameY);

    const mainX = gameX + this.cameraContext.camera.viewportWidth;
    const mainY = gameY;
    const reconX = gameX;
    const reconY = gameY + this.cameraContext.camera.viewportHeight;

    //In all recons.
    const headY = reconY + 4;
    const bodyY = reconY + 20;
    const traitX = reconX + 476;

    //In tile recon.
    const climateX = reconX + 439;

    //In entity recon.
    const armorX = reconX + 273; 
    const weaponX = reconX + 351;
    const moveX = reconX + 429;

    let tooltipX = 0;
    let tooltipHead = "";
    let tooltip = "";

    if(this.inspector.checkChange()) {
        this.lastIndex = -1;
        this.lineCache.resetRecon();
        this.lastEntityID = EntityManager.INVALID_ID;
    }

    this.iconTick = 0;
    this.style.apply(context);

    const updateTooltip = (name, desc, x, y) => {
        tooltipHead = name;
        tooltip = desc;
        tooltipX = x + ICON_WIDTH - RECON_TOOLTIP_WIDTH;
    }

    this.drawDialogueHud(gameContext, display, mainX, reconY);
    this.style.apply(context);
    this.drawMainHud(gameContext, display, mainX, mainY);

    switch(this.inspector.state) {
        case MapInspector.STATE.TILE: {
            const { terrain } = worldMap.getTileType(gameContext, tileX, tileY);
            const climateType = worldMap.getClimateType(gameContext, tileX, tileY);

            uiData.getTexture(UI_TEXTURE.RECON_TERRAIN).draw(display, reconX, reconY);

            this.drawTile(gameContext, display, tileX, tileY, reconX, reconY);
            this.style.apply(context);

            context.fillText(worldMap.getTileName(gameContext, tileX, tileY), reconX + 41, headY);
            context.fillText(language.getSystemTranslation("RECON_TRAIT"), traitX + 2, headY);

            if(this.lastIndex !== index) {
                this.lineCache.updateRecon(context, worldMap.getTileDesc(gameContext, tileX, tileY), DESCRIPTION_BOX_WIDTH_TILE);
                this.lastIndex = index;
            }

            if(this.drawIcon(gameContext, climateType.icon, display, climateX, bodyY)) {
                updateTooltip(climateType.name, climateType.desc, climateX, bodyY);
            }

            for(let i = 0; i < terrain.length; i++) {
                const { icon, name, desc } = typeRegistry.getTerrainType(terrain[i]);

                if(this.drawIcon(gameContext, icon, display, traitX + (ICON_WIDTH + 1) * i, bodyY)) {
                    updateTooltip(name, desc, traitX + (ICON_WIDTH + 1) * i, bodyY);
                }
            }

            break;
        }
        case MapInspector.STATE.MINE: {
            const { config } = worldMap.getMine(tileX, tileY);
            
            //TODO(neyn): Mine UI!
            break;
        }
        case MapInspector.STATE.BUILDING: {
            const building = worldMap.getBuilding(tileX, tileY);
            const buildingTraits = building.config.traits;

            if(this.lastIndex !== index) {
                this.lineCache.updateRecon(context, building.getDescription(gameContext), DESCRIPTION_BOX_WIDTH_TILE);
                this.lastIndex = index;

                spriteController.updateBuildingSprite(gameContext, building, this.inspectSprite.index);
            }

            uiData.getTexture(UI_TEXTURE.RECON_TERRAIN).draw(display, reconX, reconY);

            this.drawTile(gameContext, display, tileX, tileY, reconX, reconY);
            this.inspectSprite.onUpdate(realTime, deltaTime);
            this.inspectSprite.onDraw(display, reconX + 1, reconY + 5);

            context.fillText(building.getName(gameContext), reconX + 41, headY);
            context.fillText(language.getSystemTranslation("RECON_TRAIT"), traitX + 2, headY);

            for(let i = 0; i < buildingTraits.length; i++) {
                const { icon, name, desc } = typeRegistry.getBuildingTraitType(buildingTraits[i]);

                if(this.drawIcon(gameContext, icon, display, traitX + (ICON_WIDTH + 1) * i, bodyY)) {
                    updateTooltip(name, desc, traitX + (ICON_WIDTH + 1) * i, bodyY);
                }
            }

            break;
        }
        case MapInspector.STATE.ENTITY_MENU:
        case MapInspector.STATE.ENTITY: {
            const entity = world.getEntityAt(tileX, tileY);

            if(this.updateEntityState(entity)) {
                this.lineCache.updateRecon(context, entity.getDescription(gameContext), DESCRIPTION_BOX_WIDTH_ENTITY);
                this.updateInspectSprite(gameContext, entity);
            }

            uiData.getTexture(UI_TEXTURE.RECON_UNIT).draw(display, reconX, reconY);

            this.drawTile(gameContext, display, tileX, tileY, reconX, reconY);
            this.inspectSprite.onUpdate(realTime, deltaTime);
            this.inspectSprite.onDraw(display, reconX + 1, reconY + 5);

            const minRange = entity.config.minRange;
            const maxRange = entity.getMaxRange(gameContext);
            const armorType = typeRegistry.getArmorType(entity.config.armorType);
            const movementType = typeRegistry.getMovementType(entity.config.movementType);
            const weaponType = typeRegistry.getWeaponType(entity.config.weaponType);
            const vitality = entity.getVitalityCapped();
            const healthColor = getHealthColor(vitality);

            context.fillText(entity.getName(gameContext), reconX + 41, headY);
            context.fillText(language.getSystemTranslation("RECON_HEALTH"), armorX, headY);
            context.fillText(language.getSystemTranslation("RECON_DAMAGE"), weaponX, headY);
            context.fillText(language.getSystemTranslation("RECON_MOVE"), moveX, headY);
            context.fillText(language.getSystemTranslation("RECON_TRAIT"), traitX + 2, headY);

            context.fillStyle = healthColor;
            context.fillRect(armorX + ICON_WIDTH + 5, bodyY, Math.floor(vitality * RECON_VITALITY_HEALTH_WIDTH), RECON_VITALITY_HEALTH_HEIGHT);
            context.fillStyle = "#ffffff";

            if(this.drawIcon(gameContext, armorType.icon, display, armorX, bodyY)) {
                updateTooltip(armorType.name, armorType.desc, armorX, bodyY);
            }

            context.fillText(`${entity.health}/${entity.maxHealth}`, armorX + ICON_WIDTH + 2, bodyY + 10);
            uiData.getTexture(UI_TEXTURE.RECON_HEALTH).draw(display, armorX + ICON_WIDTH + 2, bodyY);

            if(this.drawIcon(gameContext, weaponType.icon, display, weaponX, bodyY)) {
                updateTooltip(weaponType.name, weaponType.desc, weaponX, bodyY);
            }

            context.fillText(`${entity.getDamage()}`, weaponX + ICON_WIDTH + 2, bodyY + 10);

            if(maxRange > 1) {
                context.fillText(`[${minRange}-${maxRange}]`, weaponX + ICON_WIDTH + 2 + 15, bodyY + 10);
            }

            if(this.drawIcon(gameContext, movementType.icon, display, moveX, bodyY)) {
                updateTooltip(movementType.name, movementType.desc, moveX, bodyY);
            }

            context.fillText(`${entity.config.movementRange}`, moveX + ICON_WIDTH + 2, bodyY + 10);

            for(let i = 0; i < entity.config.traits.length; i++) {
                const { icon, name, desc } = typeRegistry.getTraitType(entity.config.traits[i]);

                if(this.drawIcon(gameContext, icon, display, traitX + (ICON_WIDTH + 1) * i, bodyY)) {
                    updateTooltip(name, desc, traitX + (ICON_WIDTH + 1) * i, bodyY);
                }
            }

            break;
        }
        default: {
            uiData.getTexture(UI_TEXTURE.RECON_NONE).draw(display, reconX, reconY);
            break;
        }
    }

    this.lineCache.updateReconIndex(deltaTime);
    this.lineCache.drawRecon(context, reconX, bodyY);
    this.lineCache.tryUpdateTooltip(language, context, tooltip);

    //If collided with any icon.
    if(this.hotWidget >= ICON_ID_REGION && this.hotWidget < DIALOGUE_ID_REGION) {
        let tooltipTexture = UI_TEXTURE.TOOLTIP;
        let tooltipY = reconY + 17;
        let tooltipSize = 0;

        switch(this.lineCache.tooltipLines.length) {
            case 1: {
                tooltipTexture = UI_TEXTURE.TOOLTIP_MINI;
                tooltipY -= RECON_TOOLTIP_MINI_HEIGHT;
                tooltipSize = 1;
                break;
            }
            case 2: {
                tooltipTexture = UI_TEXTURE.TOOLTIP;
                tooltipY -= RECON_TOOLTIP_HEIGHT;
                tooltipSize = 2;
                break;
            }
            case 3: {
                tooltipTexture = UI_TEXTURE.TOOLTIP_PLUS;
                tooltipY -= RECON_TOOLTIP_PLUS_HEIGHT;
                tooltipSize = 3;
                break;
            }
        }

        if(tooltipX + RECON_TOOLTIP_WIDTH > mainX) {
            tooltipX = mainX - RECON_TOOLTIP_WIDTH;
        }

        uiData.getTexture(tooltipTexture).draw(display, tooltipX, tooltipY);

        if(tooltipHead.length !== 0) {
            context.textAlign = TextStyle.ALIGN.MIDDLE;
            context.fillText(language.getSystemTranslation(tooltipHead), tooltipX + (RECON_TOOLTIP_WIDTH / 2), tooltipY + 4);
            context.textAlign = TextStyle.ALIGN.LEFT;
        }

        context.fillStyle = "#000000";

        for(let i = 0; i < tooltipSize; i++) {
            context.fillText(this.lineCache.tooltipLines[i], tooltipX + 3, tooltipY + 19 + 10 * i);
        }
    }
}