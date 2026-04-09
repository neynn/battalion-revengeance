const createButtonStyle = function(width, height, regionStart) {
    const style = {
        "disabled": 0,
        "enabled": 1,
        "hot": 2,
        "active": 3,
        "width": 0,
        "height": 0,
        "halfWidth": 0,
        "halfHeight": 0
    };

    style.disabled += regionStart;
    style.enabled += regionStart;
    style.hot += regionStart;
    style.active += regionStart;
    style.width = width;
    style.height = height;
    style.halfWidth = Math.floor(width / 2);
    style.halfHeight = Math.floor(height / 2);

    return style;
}

export const UI_TEXTURE = {
    RECON_UNIT: 0,
    RECON_TERRAIN: 1,
    RECON_NONE: 2,
    RECON_MAIN: 3,
    RECON_HEALTH: 4,
    ICONS: 5,
    TOOLTIP: 6,
    TOOLTIP_PLUS: 7,
    TOOLTIP_MINI: 8,
    DIALOGUE_NEXT: 9,
    DIALOGUE_SKIP: 10,
    DIALOGUE_BOX: 11,
    HUD_BUTTONS: 12,
    HUD_GLASSPLATE: 13,
    PLAQUE: 14,
    PLAQUE_DISABLED: 15,
    STORY_CHAPTER_PANEL: 16,
    STORY_EMBLEM_SLOT: 17,
    STORY_MAIN_MENU_BORDER: 18,
    STORY_MISSION_PANEL: 19,
    STORY_EMBLEMS: 20,
    STORY_START: 21,
    GENERIC_BUTTON: 22,
    CHAPTER_ARROW: 23,
    STORY_PANELS: 24,
    _COUNT: 25
};

export const HUD_BUTTON = {
    MENU_DISABLED: 0,
    MENU_ENABLED: 1,
    MENU_HOT: 2,
    MENU_ACTIVE: 3,
    UNDO_DISABLED: 4,
    UNDO_ENABLED: 5,
    UNDO_HOT: 6,
    UNDO_ACTIVE: 7,
    QUIT_DISABLED: 8, 
    QUIT_ENABLED: 9,
    QUIT_HOT: 10,
    QUIT_ACTIVE: 11
};

export const GENERIC_BUTTON_STYLE = createButtonStyle(126, 71, 0);
export const START_BUTTON_STYLE = createButtonStyle(391, 101, 0);