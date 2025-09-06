import { getTeamName } from "../enums.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { ArmyMap } from "../init/armyMap.js";
import { AllianceSystem } from "./alliance.js";

export const PlaceSystem = function() {}

PlaceSystem.BLOCK_REASON = {
    NONE: 0,
    DEBRIS: 1,
    TILE_TYPE: 2,
    ALLIANCE_DENY: 3,
    ENTITY_BODY: 4,
    ENTITY_ATTACK: 5
};

const getBlockReason = function(gameContext, worldMap, tileX, tileY, teamName) {
    const { world } = gameContext;
    const { entityManager } = world;
    const hasDebris = worldMap.hasDebris(tileX, tileY);

    if(hasDebris) {
        return PlaceSystem.BLOCK_REASON.DEBRIS;
    }

    const typeID = worldMap.getTile(ArmyMap.LAYER.TYPE, tileX, tileY);
    const tileType = gameContext.getTileType(typeID);

    if(!tileType.allowPlacement) {
        return PlaceSystem.BLOCK_REASON.TILE_TYPE;
    }

    const teamID = worldMap.getTile(ArmyMap.LAYER.TEAM, tileX, tileY);
    const isPlaceable = AllianceSystem.isPlaceable(gameContext, teamName, getTeamName(teamID));

    if(!isPlaceable) {
        return PlaceSystem.BLOCK_REASON.ALLIANCE_DENY;
    }

    const entityID = worldMap.getTopEntity(tileX, tileY);
    const entity = entityManager.getEntity(entityID);

    if(entity !== null) {
        return PlaceSystem.BLOCK_REASON.ENTITY_BODY;
    }

    const startX = tileX - 1;
    const startY = tileY - 1;
    const endX = tileX + 1;
    const endY = tileY + 1;

    for(let y = startY; y <= endY; y++) {
        for(let x = startX; x <= endX; x++) {
            if(!worldMap.isTileOutOfBounds(x, y)) {
                const nextEntityID = worldMap.getTopEntity(x, y);
                const nextEntity = entityManager.getEntity(nextEntityID);

                if(nextEntity && nextEntity.hasComponent(ArmyEntity.COMPONENT.ATTACK)) {
                    if(AllianceSystem.isEnemy(gameContext, teamName, nextEntity.teamID)) {
                        return PlaceSystem.BLOCK_REASON.ENTITY_ATTACK;
                    }
                }
            }
        }
    }

    return PlaceSystem.BLOCK_REASON.NONE;
}

PlaceSystem.getBlockedPlaceIndices = function(gameContext, teamName) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const blockedIndices = [];

    if(!worldMap) {
        return blockedIndices;
    }

    for(let i = 0; i < worldMap.height; i++) {
        for(let j = 0; j < worldMap.width; j++) {
            const blockReason = getBlockReason(gameContext, worldMap, j, i, teamName);

            if(blockReason !== PlaceSystem.BLOCK_REASON.NONE) {
                const index = i * worldMap.width + j;

                blockedIndices.push(index, blockReason);
            }
        }
    }

    return blockedIndices;
}

PlaceSystem.isEntityPlaceable = function(gameContext, tileX, tileY, sizeX, sizeY, teamName) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return false;
    }

    const endX = tileX + sizeX;
    const endY = tileY + sizeY;

    for(let i = tileY; i < endY; i++) {
        for(let j = tileX; j < endX; j++) {
            const blockReason = getBlockReason(gameContext, worldMap, j, i, teamName);

            if(blockReason !== PlaceSystem.BLOCK_REASON.NONE) {
                return false;
            }
        }
    }

    return true;
}