import { TextStyle } from "../../engine/graphics/textStyle.js";
import { clampValue } from "../../engine/math/math.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { IM_FLAG, UIContext } from "../../engine/ui/uiContext.js";
import { MapInspector } from "../actors/player/inspector.js";
import { getHealthColor } from "../entity/helpers.js";
import { COMMANDER_TYPE, HUD_BUTTON, PLAYER_PREFERENCE, TILE_ID } from "../enums.js";
import { BattalionMap } from "../map/battalionMap.js";
import { UIData } from "./uiData.js";

const HUD_BUTTON_WIDTH = 28;
const HUD_BUTTON_HEIGHT = 40;
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

const mRegenerateLines = function(lines, context, text, maxWidth) {
    const words = text.split(' ');
    let line = '';

    for(let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        
        if(testWidth > maxWidth && line !== '') {
            lines.push(line.trim());
            line = words[i] + ' ';
        } else {
            line = testLine;
        }
    }

    if(line) {
        lines.push(line.trim());
    }
}

export const PlayUI = function(inspector, cContext, gameContext) {
    UIContext.call(this);

    this.inspector = inspector;
    this.cContext = cContext;
    this.gameContext = gameContext;
    this.inspectSprite = SpriteManager.EMPTY_SPRITE;
    this.style = new TextStyle();

    this.style.baseline = TextStyle.BASELINE.TOP;
    this.style.font = "10px arial";
    this.lines = [];
    this.tooltipLines = [];
    this.lineTime = 0;

    this.lastInspect = MapInspector.STATE.NONE;
    this.lastIndex = -1;
    this.lastTooltip = null;
    this.isCollided = false;
}

PlayUI.WIDGET_ID = {
    HUD_UNDO: 0,
    HUD_MENU: 1,
    HUD_QUIT: 2
};

PlayUI.prototype = Object.create(UIContext.prototype);
PlayUI.prototype.constructor = PlayUI;

PlayUI.prototype.load = function(gameContext) {
    const { uiData, uiManager, spriteManager } = gameContext;

    this.inspectSprite = spriteManager.createEmptySprite();
    this.inspectSprite.scale = 0.6;

    uiData.loadPlayTextures();
    uiManager.addContext(this);
}

PlayUI.prototype.regenerateLines = function(context, text, maxWidth) {
    this.lines.length = 0;
    this.lineTime = 0;

    mRegenerateLines(this.lines, context, text, maxWidth);
}

//TODO(neyn): Create a 28x28 ICON for each entity!
//This icon gets drawn instead of a full sprite!
PlayUI.prototype.updateInspectSprite = function(entity) {
    const { spriteManager } = this.gameContext;
    const { color } = entity.getTeam(this.gameContext);

    spriteManager.updateSprite(this.inspectSprite.index, entity.config.sprites.idle_right, color);
}

PlayUI.prototype.updateBuilding = function(building) {
    const { spriteManager } = this.gameContext;

    spriteManager.updateSprite(this.inspectSprite.index, building.config.sprite, building.color);
}

PlayUI.prototype.drawTile = function(display, tileX, tileY, screenX, screenY) {
    const { tileManager, world } = this.gameContext;
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

PlayUI.prototype.doIcon = function(iconID, display, screenX, screenY) {
    const { uiData, client } = this.gameContext;
    const { cursor } = client;
    const isCollided = !this.isCollided && cursor.collidesRect(screenX, screenY, ICON_WIDTH, ICON_HEIGHT);

    if(isCollided) {
        this.isCollided = true;
    }

    uiData.getTexture(UIData.TEXTURE.ICONS).drawRegion(display, iconID, screenX, screenY);

    return isCollided;
}

PlayUI.prototype.drawMainHud = function(display, screenX, screenY) {
    const { world, uiData, language, teamManager, typeRegistry } = this.gameContext;
    const { activeTeams } = teamManager;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const { context } = display;
    const buttonTexture = uiData.getTexture(UIData.TEXTURE.HUD_BUTTONS);
    const hudTexture = uiData.getTexture(UIData.TEXTURE.RECON_MAIN);

    const mainX = screenX - 14;
    const mainY = screenY;
    const textX = mainX + 86;
    const textY = mainY + 140;
    const buttonX = mainX + 33;
    const buttonY = mainY + 169;

    const undoFlags = this.doButton(this.gameContext, PlayUI.WIDGET_ID.HUD_UNDO, buttonX, buttonY, HUD_BUTTON_WIDTH, HUD_BUTTON_HEIGHT);
    const menuFlags = this.doButton(this.gameContext, PlayUI.WIDGET_ID.HUD_MENU, buttonX + 38, buttonY, HUD_BUTTON_WIDTH, HUD_BUTTON_HEIGHT);
    const quitFlags = this.doButton(this.gameContext, PlayUI.WIDGET_ID.HUD_QUIT, buttonX + 76, buttonY, HUD_BUTTON_WIDTH, HUD_BUTTON_HEIGHT);

    let undoButton = HUD_BUTTON.UNDO_ENABLED;
    let menuButton = HUD_BUTTON.MENU_ENABLED;
    let quitButton = HUD_BUTTON.QUIT_ENABLED;

    hudTexture.draw(display, mainX, mainY);
    context.textAlign = TextStyle.ALIGN.MIDDLE;

    switch(this.hotWidget) {
        case PlayUI.WIDGET_ID.HUD_UNDO: {
            undoButton = HUD_BUTTON.UNDO_HOT;
            context.fillText(language.getSystemTranslation("HUD_UNDO"), textX, textY);
            break;
        }
        case PlayUI.WIDGET_ID.HUD_MENU: {
            menuButton = HUD_BUTTON.MENU_HOT;
            context.fillText(language.getSystemTranslation("HUD_MENU"), textX, textY);
            break;
        }
        case PlayUI.WIDGET_ID.HUD_QUIT: {
            quitButton = HUD_BUTTON.QUIT_HOT;
            context.fillText(language.getSystemTranslation("HUD_QUIT"), textX, textY);
            break;
        }
        default: {
            context.fillText(language.getTranslation(worldMap.preview.title), textX, textY);
            break;
        }
    }

    context.textAlign = TextStyle.ALIGN.LEFT;

    switch(this.activeWidget) {
        case PlayUI.WIDGET_ID.HUD_UNDO: {
            undoButton = HUD_BUTTON.UNDO_ACTIVE;
            break;
        }
        case PlayUI.WIDGET_ID.HUD_MENU: {
            menuButton = HUD_BUTTON.MENU_ACTIVE;
            break;
        }
        case PlayUI.WIDGET_ID.HUD_QUIT: {
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
    const teamPlate = uiData.getTexture(UIData.TEXTURE.HUD_GLASSPLATE);

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
        context.fillText(team.getDisplayName(this.gameContext), teamX + 28, nextY + 8);
    }
}

PlayUI.prototype.drawDialogueHud = function(display, screenX, screenY) {
    const { uiData, dialogueHandler, typeRegistry, language } = this.gameContext;
    const { currentDialogue, currentText, currentIndex } = dialogueHandler;

    if(currentDialogue.length !== 0) {
        const { narrator } = currentDialogue[currentIndex];
        const commanderID = COMMANDER_TYPE[narrator] ?? COMMANDER_TYPE.NONE;
        const { portrait, name } = typeRegistry.getCommanderType(commanderID);
        const commanderName = language.getSystemTranslation(name);
        //const portraitTexture = portraitHandler.getPortraitTexture(portrait);
        const dialogueX = screenX - DIALOGUE_BOX_WIDTH;
        const dialogueY = screenY - DIALOGUE_BOX_HEIGHT;

        uiData.getTexture(UIData.TEXTURE.DIALOGUE_BOX).draw(display, dialogueX, dialogueY);
    }
}

PlayUI.prototype.onDraw = function(display, screenX, screenY) {
    const { uiData, world, language, timer, typeRegistry, portraitHandler } = this.gameContext;
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
        this.lines.length = 0;
    }

    this.isCollided = false;
    this.style.apply(context);

    const updateTooltip = (name, desc, x, y) => {
        tooltipHead = name;
        tooltip = desc;
        tooltipX = x + ICON_WIDTH - RECON_TOOLTIP_WIDTH;
    }

    this.drawDialogueHud(display, mainX, reconY);
    this.drawMainHud(display, mainX, mainY);

    switch(this.lastInspect) {
        case MapInspector.STATE.NONE: {
             uiData.getTexture(UIData.TEXTURE.RECON_NONE).draw(display, reconX, reconY);
            break;
        }
        case MapInspector.STATE.TILE: {
            const { terrain } = worldMap.getTileType(this.gameContext, tileX, tileY);
            const climateType = worldMap.getClimateType(this.gameContext, tileX, tileY);

             uiData.getTexture(UIData.TEXTURE.RECON_TERRAIN).draw(display, reconX, reconY);

            this.drawTile(display, tileX, tileY, reconX, reconY);
            this.style.apply(context);

            context.fillText(worldMap.getTileName(this.gameContext, tileX, tileY), reconX + 41, headY);
            context.fillText(language.getSystemTranslation("RECON_TRAIT"), traitX + 2, headY);

            if(this.lastIndex !== index) {
                this.regenerateLines(context, worldMap.getTileDesc(this.gameContext, tileX, tileY), DESCRIPTION_BOX_WIDTH_TILE);
                this.lastIndex = index;
            }

            if(this.doIcon(climateType.icon, display, climateX, bodyY)) {
                updateTooltip(climateType.name, climateType.desc, climateX, bodyY);
            }

            for(let i = 0; i < terrain.length; i++) {
                const { icon, name, desc } = typeRegistry.getTerrainType(terrain[i]);

                if(this.doIcon(icon, display, traitX + (ICON_WIDTH + 1) * i, bodyY)) {
                    updateTooltip(name, desc, traitX + (ICON_WIDTH + 1) * i, bodyY);
                }
            }

            break;
        }
        case MapInspector.STATE.BUILDING: {
            const building = worldMap.getBuilding(tileX, tileY);

            if(this.lastIndex !== index) {
                this.regenerateLines(context, building.getDescription(this.gameContext), DESCRIPTION_BOX_WIDTH_TILE);
                this.updateBuilding(building);
                this.lastIndex = index;
            }

            uiData.getTexture(UIData.TEXTURE.RECON_TERRAIN).draw(display, reconX, reconY);

            this.drawTile(display, tileX, tileY, reconX, reconY);
            this.inspectSprite.onUpdate(realTime, deltaTime);
            this.inspectSprite.onDraw(display, reconX + 1, reconY + 5);

            context.fillText(building.getName(this.gameContext), reconX + 41, headY);
            context.fillText(language.getSystemTranslation("RECON_TRAIT"), traitX + 2, headY);

            for(let i = 0; i < building.config.traits.length; i++) {
                const { icon, name, desc } = typeRegistry.getTraitType(building.config.traits[i]);

                if(this.doIcon(icon, display, traitX + (ICON_WIDTH + 1) * i, bodyY)) {
                    updateTooltip(name, desc, traitX + (ICON_WIDTH + 1) * i, bodyY);
                }
            }

            break;
        }
        case MapInspector.STATE.ENTITY: {
            const entity = world.getEntityAt(tileX, tileY);

            if(this.lastIndex !== index) {
                this.regenerateLines(context, entity.getDescription(this.gameContext), DESCRIPTION_BOX_WIDTH_ENTITY);
                this.updateInspectSprite(entity);
                this.lastIndex = index;
            }

            uiData.getTexture(UIData.TEXTURE.RECON_UNIT).draw(display, reconX, reconY);

            this.drawTile(display, tileX, tileY, reconX, reconY);
            this.inspectSprite.onUpdate(realTime, deltaTime);
            this.inspectSprite.onDraw(display, reconX + 1, reconY + 5);

            const minRange = entity.config.minRange;
            const maxRange = entity.getMaxRange(this.gameContext);
            const armorType = typeRegistry.getArmorType(entity.config.armorType);
            const movementType = typeRegistry.getMovementType(entity.config.movementType);
            const weaponType = typeRegistry.getWeaponType(entity.config.weaponType);
            const vitality = clampValue(entity.getVitality(), 1, 0);
            const healthColor = getHealthColor(vitality);

            context.fillText(entity.getName(this.gameContext), reconX + 41, headY);
            context.fillText(language.getSystemTranslation("RECON_HEALTH"), armorX, headY);
            context.fillText(language.getSystemTranslation("RECON_DAMAGE"), weaponX, headY);
            context.fillText(language.getSystemTranslation("RECON_MOVE"), moveX, headY);
            context.fillText(language.getSystemTranslation("RECON_TRAIT"), traitX + 2, headY);

            context.fillStyle = healthColor;
            context.fillRect(armorX + ICON_WIDTH + 5, bodyY, Math.floor(vitality * RECON_VITALITY_HEALTH_WIDTH), RECON_VITALITY_HEALTH_HEIGHT);
            context.fillStyle = "#ffffff";

            if(this.doIcon(armorType.icon, display, armorX, bodyY)) {
                updateTooltip(armorType.name, armorType.desc, armorX, bodyY);
            }

            context.fillText(`${entity.health}/${entity.maxHealth}`, armorX + ICON_WIDTH + 2, bodyY + 10);
            uiData.getTexture(UIData.TEXTURE.RECON_HEALTH).draw(display, armorX + ICON_WIDTH + 2, bodyY);

            if(this.doIcon(weaponType.icon, display, weaponX, bodyY)) {
                updateTooltip(weaponType.name, weaponType.desc, weaponX, bodyY);
            }

            context.fillText(`${entity.damage}`, weaponX + ICON_WIDTH + 2, bodyY + 10);

            if(maxRange > 1) {
                context.fillText(`[${minRange}-${maxRange}]`, weaponX + ICON_WIDTH + 2 + 15, bodyY + 10);
            }

            if(this.doIcon(movementType.icon, display, moveX, bodyY)) {
                updateTooltip(movementType.name, movementType.desc, moveX, bodyY);
            }

            context.fillText(`${entity.config.movementRange}`, moveX + ICON_WIDTH + 2, bodyY + 10);

            for(let i = 0; i < entity.config.traits.length; i++) {
                const { icon, name, desc } = typeRegistry.getTraitType(entity.config.traits[i]);

                if(this.doIcon(icon, display, traitX + (ICON_WIDTH + 1) * i, bodyY)) {
                    updateTooltip(name, desc, traitX + (ICON_WIDTH + 1) * i, bodyY);
                }
            }

            break;
        }
    }

    context.fillStyle = "#ffffff";
    
    switch(this.lines.length) {
        case 0: {
            break;
        }
        case 1: {
            context.fillText(this.lines[0], reconX + 39, bodyY);
            break;
        }
        case 2: {
            context.fillText(this.lines[0], reconX + 39, bodyY);
            context.fillText(this.lines[1], reconX + 39, bodyY + 10);
            break;
        }
        default: {
            const SECONDS_PER_LINE = 2;
            const frameIndex = Math.floor(this.lineTime / SECONDS_PER_LINE) % this.lines.length;

            context.fillText(this.lines[frameIndex], reconX + 39, bodyY);

            if(frameIndex < this.lines.length - 1) {
                context.fillText(this.lines[frameIndex + 1], reconX + 39, bodyY + 10);
            }

            this.lineTime += this.gameContext.timer.deltaTime;
            break;
        }
    }

    if(this.tooltip !== tooltip) {
        this.tooltipLines.length = 0;
        this.tooltip = tooltip;

        if(tooltip.length !== 0) {
            const text = language.getSystemTranslation(tooltip);

            mRegenerateLines(this.tooltipLines, context, text, RECON_TOOLTIP_BOX_WIDTH);
        }
    }

    if(this.isCollided) {
        let tooltipTexture = UIData.TEXTURE.TOOLTIP;
        let tooltipY = reconY + 17;
        let tooltipSize = 0;

        switch(this.tooltipLines.length) {
            case 1: {
                tooltipTexture = UIData.TEXTURE.TOOLTIP_MINI;
                tooltipY -= RECON_TOOLTIP_MINI_HEIGHT;
                tooltipSize = 1;
                break;
            }
            case 2: {
                tooltipTexture = UIData.TEXTURE.TOOLTIP;
                tooltipY -= RECON_TOOLTIP_HEIGHT;
                tooltipSize = 2;
                break;
            }
            case 3: {
                tooltipTexture = UIData.TEXTURE.TOOLTIP_PLUS;
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