import { TextStyle } from "../../../engine/graphics/textStyle.js";
import { clampValue, toCenter } from "../../../engine/math/math.js";
import { SpriteManager } from "../../../engine/sprite/spriteManager.js";
import { IM_FLAG, UIContext } from "../../../engine/ui/uiContext.js";
import { MapInspector } from "../../actors/player/inspector.js";
import { getHealthColor } from "../../entity/helpers.js";
import { COMMANDER_TYPE, ENTITY_SPRITE, TILE_ID } from "../../enums.js";
import { UI_TEXTURE, HUD_BUTTON, GENERIC_BUTTON_STYLE, HUD_BUTTON_STYLE } from "../constants.js";
import { BattalionMap } from "../../map/battalionMap.js";
import { isDrawTime, mRegenerateLines } from "../helpers.js";
import { createEndTurnIntent } from "../../action/actionHelper.js";
import { ActorManager } from "../../../engine/world/actor/actorManager.js";

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

const TILE_DRAW_ORDER = [
    BattalionMap.LAYER.GROUND,
    BattalionMap.LAYER.DECORATION,
    BattalionMap.LAYER.CLOUD
];

export const PlayUI = function(cContext) {
    UIContext.call(this);

    this.doImmediate = true;
    this.cContext = cContext;
    this.inspector = new MapInspector();
    this.inspectSprite = SpriteManager.EMPTY_SPRITE;

    this.style = new TextStyle();
    this.style.baseline = TextStyle.BASELINE.TOP;
    this.style.font = "10px arial";
    this.reconLines = [];
    this.tooltipLines = [];
    this.dialogueLines = [];
    this.dialogueChars = 0;
    this.lineTime = 0;

    this.lastInspect = MapInspector.STATE.NONE;
    this.lastIndex = -1;
    this.lastTooltip = null;

    this.iconTick = 0;
}

PlayUI.WIDGET_ID = {
    HUD_UNDO: 0,
    HUD_MENU: 1,
    HUD_QUIT: 2
};

PlayUI.prototype = Object.create(UIContext.prototype);
PlayUI.prototype.constructor = PlayUI;

PlayUI.prototype.getHudTitle = function(gameContext) {
    const { language, missionManager, world } = gameContext;
    const { mapManager } = world;
    const { currentMission } = missionManager;

    if(!currentMission) {
        const worldMap = mapManager.getActiveMap();
        
        return worldMap.preview.title;
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

PlayUI.prototype.regenerateLines = function(context, text, maxWidth) {
    this.reconLines.length = 0;
    this.lineTime = 0;

    mRegenerateLines(this.reconLines, context, text, maxWidth);
}

//TODO(neyn): Create a 28x28 ICON for each entity!
//This icon gets drawn instead of a full sprite!
PlayUI.prototype.updateInspectSprite = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const { color } = entity.getTeam(gameContext);
    const spriteName = entity.config.sprites[ENTITY_SPRITE.IDLE_RIGHT];

    spriteManager.updateSprite(this.inspectSprite.index, spriteName, color);
}

PlayUI.prototype.updateBuilding = function(gameContext, building) {
    const { spriteManager } = gameContext;

    spriteManager.updateSprite(this.inspectSprite.index, building.config.sprite, building.color);
}

PlayUI.prototype.drawTile = function(gameContext, display, tileX, tileY, screenX, screenY) {
    const { tileManager, world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const { context } = display;

    for(const layerID of TILE_DRAW_ORDER) {
        const tileID = worldMap.getTile(layerID, tileX, tileY);

        if(tileID > TILE_ID.NONE) {
            this.cContext.camera.drawTile(tileManager, tileID, context, screenX + 4, screenY + 11, 0.5);
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
    const { activeTeams } = teamManager;
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

    for(let i = 0; i < teamDraws; i++) {
        const nextY = teamY + TEAM_OFFSET_Y * i;
        const teamID = activeTeams[i];
        const team = teamManager.getTeam(teamID);
        const { hudColor, textColor } = typeRegistry.getSchemaType(team.color);

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
            actor.addIntent(createEndTurnIntent());
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
    const { fullText, letterIndex } = dialogueHandler;
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
    const { portrait, name } = typeRegistry.getCommanderType(COMMANDER_TYPE[narrator] ?? COMMANDER_TYPE.NONE);
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

    if(dialogueHandler.hasEntryChanged()) {
        this.dialogueLines.length = 0;
        let charCount = 0;

        mRegenerateLines(this.dialogueLines, context, fullText, 418);

        for(let i = 0; i < this.dialogueLines.length; i++) {
            charCount += this.dialogueLines[i].length;
        }

        dialogueHandler.setLetterCount(charCount);
    }
    
    let remainingChars = letterIndex;
    let fullLinesToDraw = 0;

    for(let i = 0; i < this.dialogueLines.length; i++) {
        const lineLength =  this.dialogueLines[i].length;
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

        context.fillText(this.dialogueLines[i], textX, drawY);
    }

    if(fullLinesToDraw < this.dialogueLines.length) {
        const nextLine = this.dialogueLines[fullLinesToDraw];
        const text = nextLine.substring(0, remainingChars);
        const drawY = textY + 20 * fullLinesToDraw;

        context.fillText(text, textX, drawY);
    } else if(fullLinesToDraw === this.dialogueLines.length) {
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

        this.dialogueLines.length = 0;
    }
}

PlayUI.prototype.onImmediate = function(gameContext, display) {
    const { uiData, world, language, timer, typeRegistry } = gameContext;
    const { mapManager } = world;
    const { realTime, deltaTime } = timer;
    const { context } = display;
    const tileX = this.inspector.lastX;
    const tileY = this.inspector.lastY;
    const worldMap = mapManager.getActiveMap();
    const index = worldMap.getIndex(tileX, tileY);

    const mainX = this.cContext.positionX + this.cContext.camera.viewportWidth;
    const mainY = this.cContext.positionY;
    const reconX = this.cContext.positionX;
    const reconY = this.cContext.positionY + this.cContext.camera.viewportHeight;

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

    if(this.lastInspect !== this.inspector.state) {
        this.lastIndex = -1;
        this.lastInspect = this.inspector.state;
        this.reconLines.length = 0;
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

    switch(this.lastInspect) {
        case MapInspector.STATE.TILE: {
            const { terrain } = worldMap.getTileType(gameContext, tileX, tileY);
            const climateType = worldMap.getClimateType(gameContext, tileX, tileY);

             uiData.getTexture(UI_TEXTURE.RECON_TERRAIN).draw(display, reconX, reconY);

            this.drawTile(gameContext, display, tileX, tileY, reconX, reconY);
            this.style.apply(context);

            context.fillText(worldMap.getTileName(gameContext, tileX, tileY), reconX + 41, headY);
            context.fillText(language.getSystemTranslation("RECON_TRAIT"), traitX + 2, headY);

            if(this.lastIndex !== index) {
                this.regenerateLines(context, worldMap.getTileDesc(gameContext, tileX, tileY), DESCRIPTION_BOX_WIDTH_TILE);
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
        case MapInspector.STATE.BUILDING: {
            const building = worldMap.getBuilding(tileX, tileY);

            if(this.lastIndex !== index) {
                this.regenerateLines(context, building.getDescription(gameContext), DESCRIPTION_BOX_WIDTH_TILE);
                this.updateBuilding(gameContext, building);
                this.lastIndex = index;
            }

            uiData.getTexture(UI_TEXTURE.RECON_TERRAIN).draw(display, reconX, reconY);

            this.drawTile(gameContext, display, tileX, tileY, reconX, reconY);
            this.inspectSprite.onUpdate(realTime, deltaTime);
            this.inspectSprite.onDraw(display, reconX + 1, reconY + 5);

            context.fillText(building.getName(gameContext), reconX + 41, headY);
            context.fillText(language.getSystemTranslation("RECON_TRAIT"), traitX + 2, headY);

            for(let i = 0; i < building.config.traits.length; i++) {
                const { icon, name, desc } = typeRegistry.getTraitType(building.config.traits[i]);

                if(this.drawIcon(gameContext, icon, display, traitX + (ICON_WIDTH + 1) * i, bodyY)) {
                    updateTooltip(name, desc, traitX + (ICON_WIDTH + 1) * i, bodyY);
                }
            }

            break;
        }
        case MapInspector.STATE.ENTITY: {
            const entity = world.getEntityAt(tileX, tileY);

            if(this.lastIndex !== index) {
                this.regenerateLines(context, entity.getDescription(gameContext), DESCRIPTION_BOX_WIDTH_ENTITY);
                this.updateInspectSprite(gameContext, entity);
                this.lastIndex = index;
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
            const vitality = clampValue(entity.getVitality(), 1, 0);
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

            context.fillText(`${entity.damage}`, weaponX + ICON_WIDTH + 2, bodyY + 10);

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

    context.fillStyle = "#ffffff";
    
    switch(this.reconLines.length) {
        case 0: {
            break;
        }
        case 1: {
            context.fillText(this.reconLines[0], reconX + 39, bodyY);
            break;
        }
        case 2: {
            context.fillText(this.reconLines[0], reconX + 39, bodyY);
            context.fillText(this.reconLines[1], reconX + 39, bodyY + 10);
            break;
        }
        default: {
            const SECONDS_PER_LINE = 2;
            const frameIndex = Math.floor(this.lineTime / SECONDS_PER_LINE) % this.reconLines.length;

            context.fillText(this.reconLines[frameIndex], reconX + 39, bodyY);

            if(frameIndex < this.reconLines.length - 1) {
                context.fillText(this.reconLines[frameIndex + 1], reconX + 39, bodyY + 10);
            }

            this.lineTime += gameContext.timer.deltaTime;
            break;
        }
    }

    if(this.lastTooltip !== tooltip) {
        this.tooltipLines.length = 0;
        this.lastTooltip = tooltip;

        if(tooltip.length !== 0) {
            const text = language.getSystemTranslation(tooltip);

            mRegenerateLines(this.tooltipLines, context, text, RECON_TOOLTIP_BOX_WIDTH);
        }
    }

    //If collided with any icon.
    if(this.hotWidget >= ICON_ID_REGION && this.hotWidget < DIALOGUE_ID_REGION) {
        let tooltipTexture = UI_TEXTURE.TOOLTIP;
        let tooltipY = reconY + 17;
        let tooltipSize = 0;

        switch(this.tooltipLines.length) {
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
            context.fillText(this.tooltipLines[i], tooltipX + 3, tooltipY + 19 + 10 * i);
        }
    }
}