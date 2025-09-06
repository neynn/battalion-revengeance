import { TileManager } from "../engine/tile/tileManager.js";

export const ArmyResources = function() {
    this.tileConversions = {};
    this.itemTypes = {};
    this.resourceTypes = {};
    this.collectionTypes = {};
    this.debrisTypes = {};
    this.allianceTypes = {};
    this.fireCallTypes = {};
    this.tileFormConditions = {};
    this.shopItemTypes = {};
    this.editorConfig = {};
    this.tileTypes = {};
    this.keybinds = {};
    this.teamTypes = {};
    this.productionTypes = {};
}

ArmyResources.prototype.load = function(gameContext, resources) {
    this.tileConversions = this.initConversions(gameContext, resources.teamTileConversion);
    this.itemTypes = resources.items;
    this.resourceTypes = resources.resources;
    this.collectionTypes = resources.collections;
    this.debrisTypes = resources.debris;
    this.allianceTypes = resources.alliances;
    this.fireCallTypes = resources.fireCalls;
    this.tileFormConditions = resources.tileFormConditions;
    this.shopItemTypes = resources.shopItems;
    this.editorConfig = resources.editor;
    this.tileTypes = resources.tileTypes;
    this.keybinds = resources.keybinds;
    this.teamTypes = resources.teams;
    this.productionTypes = resources.productionTypes;
}

ArmyResources.prototype.initConversions = function(gameContext, teamConversions) {
    const { tileManager } = gameContext;
    const updatedConversions = {};

    for(const teamID in teamConversions) {
        const atlases = teamConversions[teamID];
        const teamConversion = {};

        for(const atlasID in atlases) {
            const atlas = atlases[atlasID];

            for(const textureID in atlas) {
                const tileID = tileManager.getTileID(atlasID, textureID);

                if(tileID === TileManager.TILE_ID.EMPTY) {
                    continue;
                }

                const [a, b] = atlas[textureID];
                const convertedID = tileManager.getTileID(a, b);

                if(convertedID === TileManager.TILE_ID.EMPTY) {
                    continue;
                }

                teamConversion[tileID] = convertedID;
            }
        }

        updatedConversions[teamID] = teamConversion;
    }

    return updatedConversions;
}