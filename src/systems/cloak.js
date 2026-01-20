import { BattalionEntity } from "../entity/battalionEntity.js";
import { TRAIT_TYPE } from "../enums.js";
import { JammerField } from "../map/jammerField.js";

export const mGetUncloakedEntities = function(gameContext, targetX, targetY, teamID, entityType, mUncloakedList) {
    const { world, teamManager } = gameContext;
    const { mapManager, entityManager } = world;
    const worldMap = mapManager.getActiveMap();
    const jammerFlags = entityType.getJammerFlags();
    const searchRange = jammerFlags !== JammerField.FLAG.NONE ? entityType.jammerRange : 1;
    let shouldSelfUncloak = false;

    worldMap.fill2DGraph(targetX, targetY, searchRange, (tileX, tileY, tileD, tileI) => {
        const entityID = worldMap.getTopEntity(tileX, tileY);
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
                const cloakFlag = entity.getCloakFlag();

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