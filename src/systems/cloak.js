import { BattalionEntity } from "../entity/battalionEntity.js";
import { mineTypeToJammer } from "../enumHelpers.js";
import { JAMMER_FLAG, TRAIT_TYPE } from "../enums.js";

export const mGetUncloakedMines = function(gameContext, targetX, targetY, teamID, entityType, mUncloakedList) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const jammerFlags = entityType.getJammerFlags();
    const searchRange = jammerFlags !== JAMMER_FLAG.NONE ? entityType.jammerRange : 0;
    let standsOnMine = false;

    worldMap.fill2DGraph(targetX, targetY, searchRange, (tileX, tileY, tileD, tileI) => {
        const mine = worldMap.getMine(tileX, tileY);

        if(mine && mine.isHidden()) {
            let isDetected = false;

            if(tileD === 0) {
                isDetected = true;
                standsOnMine = mine.isEnemy(gameContext, teamID);
            } else {
                const { type } = mine;
                const neededFlag = mineTypeToJammer(type);

                isDetected = (jammerFlags & neededFlag) !== 0;
            }

            if(isDetected && mine.isEnemy(gameContext, teamID)) {
                mUncloakedList.push(mine);
            }
        }
    });

    return standsOnMine;
}

export const mGetUncloakedEntities = function(gameContext, targetX, targetY, teamID, entityType, mUncloakedList) {
    const { world, teamManager } = gameContext;
    const { mapManager, entityManager } = world;
    const worldMap = mapManager.getActiveMap();
    const jammerFlags = entityType.getJammerFlags();
    const searchRange = jammerFlags !== JAMMER_FLAG.NONE ? entityType.jammerRange : 1;
    let shouldSelfUncloak = false;

    worldMap.fill2DGraph(targetX, targetY, searchRange, (tileX, tileY, tileD, tileI) => {
        const entityID = worldMap.getEntity(tileX, tileY);
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            const distance = entity.getDistanceToTile(targetX, targetY);

            //ALWAYS uncloak neighbors.
            if(distance === 1) {
                //isVisibleTo check, but split up.
                if(!teamManager.isAlly(teamID, entity.teamID)) {
                    if(entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
                        mUncloakedList.push(entity);
                    }

                    //Always uncloak next to an enemy.
                    shouldSelfUncloak = true;
                }
            } else {
                const cloakFlag = entity.config.getCloakFlag();

                if(jammerFlags & cloakFlag) {
                    if(!entity.hasTrait(TRAIT_TYPE.UNFAIR) && !entity.isVisibleTo(gameContext, teamID)) {
                        mUncloakedList.push(entity);
                    }
                }
            }
        }
    });

    return shouldSelfUncloak;
}