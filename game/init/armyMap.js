import { Autotiler } from "../../engine/tile/autotiler.js";
import { WorldMap } from "../../engine/map/worldMap.js";
import { AllianceSystem } from "../systems/alliance.js";
import { DropHandler } from "./armyMap/dropHandler.js";
import { Shop } from "./armyMap/shop.js";
import { getTeamName, TILE_TYPE } from "../enums.js";
import { PlayCamera } from "../camera/playCamera.js";

export const ArmyMap = function(id) {
    WorldMap.call(this, id);

    this.type = ArmyMap.TYPE.NONE;
    this.debris = new Map();
    this.drops = new DropHandler();
    this.shop = new Shop();
}

ArmyMap.FLAG = {
    NONE: 0,
    ALLOW_PASSING: 1 << 0,
    ALLOW_BORDER: 1 << 1,
    ALLOW_DROPS: 1 << 2,
    ALLOW_CAPTURE: 1 << 3,
    NEUTRAL: 1 << 4
};

ArmyMap.TYPE = {
    NONE: 0,
    VERSUS: 1,
    STORY: 2,
    STRIKE: 3
};

ArmyMap.AUTOTILER = {
    CLOUD: "cloud",
    BORDER: "border",
    RANGE: "range",
    DESERT_SHORE: "shore"
};

ArmyMap.LAYER = {
    GROUND: "ground",
    DECORATION: "decoration",
    CLOUD: "cloud",
    TYPE: "type",
    TEAM: "team"
};

ArmyMap.CONVERTABLE_LAYERS = [
    ArmyMap.LAYER.GROUND,
    ArmyMap.LAYER.DECORATION
];

ArmyMap.prototype = Object.create(WorldMap.prototype);
ArmyMap.prototype.constructor = ArmyMap;

ArmyMap.prototype.update = function(gameContext) {
    this.drops.update(gameContext, this);
}

ArmyMap.prototype.load = function(data) {
    const { debris } = data;

    for(let i = 0; i < debris.length; i++) {
        const { type, x, y } = debris[i];

        this.addDebris(type, x, y);
    }
}

ArmyMap.prototype.save = function() {
    const debris = [];

    this.debris.forEach(({type, x, y}) => {
        debris.push({
            "type": type,
            "x": x,
            "y": y
        });
    });

    return {
        "id": this.id,
        "debris": debris
    }
}

ArmyMap.prototype.isFullyClouded = function(tileX, tileY) {
    const tileID = this.getTile(ArmyMap.LAYER.CLOUD, tileX, tileY);

    if(tileID === 0) {
        return false;
    }

    const startX = tileX - 1;
    const startY = tileY - 1;
    const endX = tileX + 1;
    const endY = tileY + 1;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            const nextID = this.getTile(ArmyMap.LAYER.CLOUD, j, i);

            if(nextID === 0) {
                return false;
            }
        }
    }

    return true;
}

ArmyMap.prototype.clearClouds = function(gameContext, tileX, tileY, width, height) {
    const { tileManager } = gameContext;
    const cloudAutotiler = tileManager.getAutotilerByID(ArmyMap.AUTOTILER.CLOUD);

    const endX = tileX + width;
    const endY = tileY + height;

    for(let i = tileY; i < endY; i++) {
        for(let j = tileX; j < endX; j++) {
            this.clearTile(ArmyMap.LAYER.CLOUD, j, i);
        }
    }

    this.updateClouds(cloudAutotiler, tileX, tileY, width, height);
}

ArmyMap.prototype.conquerTile = function(gameContext, teamID, tileX, tileY) {
    this.placeTile(teamID, ArmyMap.LAYER.TEAM, tileX, tileY);
    this.updateShoreTiles(gameContext, tileX, tileY, 1);
    this.convertGraphicToTeam(gameContext, tileX, tileY);
    this.updateBorder(gameContext, tileX, tileY, 1);
}

ArmyMap.prototype.updateAllBorders = function(gameContext) {    
    if(!gameContext.settings.calculateBorder) {
        return;
    }

    const { world, tileManager } = gameContext;
    const { turnManager } = world;
    const autotiler = tileManager.getAutotilerByID(ArmyMap.AUTOTILER.BORDER);

    turnManager.forAllActors((actor) => {
        const { camera, teamID } = actor;

        if(!(camera instanceof PlayCamera) || teamID === undefined) {
            return;
        }

        const borderLayer = camera.getLayer(PlayCamera.LAYER.BORDER);

        for(let i = 0; i < this.height; i++) {
            for(let j = 0; j < this.width; j++) {
                const borderID = this.getBorderID(gameContext, autotiler, j, i, teamID);
                const index = this.getIndex(j, i);

                borderLayer.setItem(borderID, index);
            }
        }
    });
}

ArmyMap.prototype.updateBorder = function(gameContext, tileX, tileY, range) {
    if(!gameContext.settings.calculateBorder) {
        return;
    }

    const { world, tileManager } = gameContext;
    const { turnManager } = world;
    const autotiler = tileManager.getAutotilerByID(ArmyMap.AUTOTILER.BORDER);

    turnManager.forAllActors((actor) => {
        const { camera, teamID } = actor;

        if(!(camera instanceof PlayCamera) || teamID === undefined) {
            return;
        }

        const borderLayer = camera.getLayer(PlayCamera.LAYER.BORDER);
        const startX = tileX - range;
        const startY = tileY - range;
        const endX = tileX + range;
        const endY = tileY + range;
    
        for(let i = startY; i <= endY; i++) {
            for(let j = startX; j <= endX; j++) {
                const borderID = this.getBorderID(gameContext, autotiler, j, i, teamID);
                const index = this.getIndex(j, i);

                borderLayer.setItem(borderID, index);
            }
        }
    });
}

ArmyMap.prototype.updateClouds = function(autotiler, tileX, tileY, width, height) {
    const startCornerX = tileX - 1;
    const startCornerY = tileY - 1;
    const endCornerX = tileX + width;
    const endCornerY = tileY + height;

    for(let i = startCornerY; i <= endCornerY; i++) {
        this.applyAutotiler(autotiler, startCornerX, i, ArmyMap.LAYER.CLOUD, false);
        this.applyAutotiler(autotiler, endCornerX, i, ArmyMap.LAYER.CLOUD, false);
    }

    for(let j = startCornerX; j <= endCornerX; j++) {
        this.applyAutotiler(autotiler, j, startCornerY, ArmyMap.LAYER.CLOUD, false);
        this.applyAutotiler(autotiler, j, endCornerY, ArmyMap.LAYER.CLOUD, false);
    }
}

ArmyMap.prototype.hasDebris = function(tileX, tileY) {
    const index = this.getIndex(tileX, tileY);
    const hasDebris = index !== -1 && this.debris.has(index);

    return hasDebris;
}

ArmyMap.prototype.removeDebris = function(tileX, tileY) {
    const index = this.getIndex(tileX, tileY);

    if(index !== -1 && this.debris.has(index)) {
        this.debris.delete(index);
    }
}

ArmyMap.prototype.addDebris = function(type, tileX, tileY) {
    const index = this.getIndex(tileX, tileY);

    if(index !== -1 && !this.debris.has(index)) {
        this.debris.set(index, {
            "type": type,
            "x": tileX,
            "y": tileY
        });
    }
}

ArmyMap.prototype.saveFlags = function() {
    const flags = [];

    for(const flagID in ArmyMap.FLAG) {
        const flag = ArmyMap.FLAG[flagID];

        if(this.hasFlag(flag)) {
            flags.push(flagID);
        }
    }

    return flags;
}

ArmyMap.prototype.init = function(gameContext, config = {}) {
    const {
        width = 0,
        height = 0,
        flags = [],
        music = null
    } = config;

    this.width = width;
    this.height = height;
    this.music = music;

    for(let i = 0; i < flags.length; i++) {
        const flagID = flags[i];
        const flag = ArmyMap.FLAG[flagID];
        
        if(flag) {
            this.flags |= flag;
        }
    }
}

ArmyMap.prototype.reload = function(gameContext) {
    for(let i = 0; i < this.height; i++) {
        for(let j = 0; j < this.width; j++) {
            this.updateShoreTiles(gameContext, j, i, 0);
            this.convertGraphicToTeam(gameContext, j, i);
        }
    }

    if(this.hasFlag(ArmyMap.FLAG.ALLOW_BORDER)) {
        this.updateAllBorders(gameContext);
    }
}

ArmyMap.prototype.isFormValid = function(gameContext, groundID, tileX, tileY, teamID) {
    const animationForm = gameContext.getAnimationForm(groundID);

    if(!animationForm) {
        return false;
    }

    //May God forgive me.
    for(let n = 0; n < animationForm.length; n++) {
        if(animationForm[n] === 1) {
            const row = Math.floor(n / 3);
            const column = n % 3;
            const checkX = tileX + (column - 1);
            const checkY = tileY + (row - 1);
            const checkTeamID = this.getTile(ArmyMap.LAYER.TEAM, checkX, checkY);
                
            if(checkTeamID !== teamID) {
                return false;
            }
        }
    }

    return true;
}

ArmyMap.prototype.updateShoreTiles = function(gameContext, tileX, tileY, range) {
    const { tileManager } = gameContext;
    const teamID = this.getTile(ArmyMap.LAYER.TEAM, tileX, tileY);

    const startX = tileX - range;
    const startY = tileY - range;
    const endX = tileX + range;
    const endY = tileY + range;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            const typeID = this.getTile(ArmyMap.LAYER.TYPE, j, i);

            if(typeID === TILE_TYPE.SHORE) {
                const groundID = this.getTile(ArmyMap.LAYER.GROUND, j, i);
                const isFormValid = this.isFormValid(gameContext, groundID, j, i, teamID);

                if(isFormValid) {
                    const conversionID = gameContext.getConversionID(groundID, teamID);

                    if(tileManager.hasTile(conversionID)) {
                        this.placeTile(conversionID, ArmyMap.LAYER.GROUND, j, i);
                    }
                }
            }
        }
    }
}

ArmyMap.prototype.convertGraphicToTeam = function(gameContext, tileX, tileY) {
    const { tileManager } = gameContext;
    const teamID = this.getTile(ArmyMap.LAYER.TEAM, tileX, tileY);

    for(let i = 0; i < ArmyMap.CONVERTABLE_LAYERS.length; i++) {
        const layerID = ArmyMap.CONVERTABLE_LAYERS[i];
        const tileID = this.getTile(layerID, tileX, tileY);
        const conversionID = gameContext.getConversionID(tileID, teamID);

        if(tileManager.hasTile(conversionID)) {
            this.placeTile(conversionID, layerID, tileX, tileY);
        }
    }
}

ArmyMap.prototype.getBorderID = function(gameContext, autotiler, tileX, tileY, teamID) {
    if(!this.hasFlag(ArmyMap.FLAG.ALLOW_BORDER)) {
        return 0;
    }
    
    const centerTypeID = this.getTile(ArmyMap.LAYER.TYPE, tileX, tileY);
    const centerType = gameContext.getTileType(centerTypeID);

    if(!centerType.hasBorder) {
        return 0;
    }

    const centerTeamID = this.getTile(ArmyMap.LAYER.TEAM, tileX, tileY);
    const isEnemy = AllianceSystem.isEnemy(gameContext, teamID, getTeamName(centerTeamID));

    if(isEnemy) {
        return 0;
    }

    const tileID = autotiler.run(tileX, tileY, (x, y) => {
        const neighborTypeID = this.getTile(ArmyMap.LAYER.TYPE, x, y);
        const neighborType = gameContext.getTileType(neighborTypeID);

        if(!neighborType.hasBorder) {
            return Autotiler.RESPONSE.INVALID;
        }

        const neighborTeamID = this.getTile(ArmyMap.LAYER.TEAM, x, y);
        const isEnemy = AllianceSystem.isEnemy(gameContext, getTeamName(centerTeamID), getTeamName(neighborTeamID));

        if(isEnemy) {
            return Autotiler.RESPONSE.INVALID;
        }

        return Autotiler.RESPONSE.VALID;
    });

    return tileID;
}

ArmyMap.prototype.createDrops = function(gameContext, inventory, drops, tileX, tileY) {
    if(this.hasFlag(ArmyMap.FLAG.ALLOW_DROPS)) {
        this.drops.createDrops(gameContext, inventory, drops, tileX, tileY);
    } else {
        this.drops.addImmediateDrops(inventory, drops);
    }
}

