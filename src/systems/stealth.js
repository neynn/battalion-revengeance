import { BattalionEntity } from "../entity/battalionEntity.js";
import { Mine } from "../entity/mine.js";
import { BUILDING_TRAIT, JAMMER_FLAG, TRAIT_TYPE } from "../enums.js";

const DEFAULT_MINE_SEARCH_RANGE = 0;
const DEFAULT_ENTITY_SEARCH_RANGE = 1;

export const StealthSystem = {
    /**
     * 
     * @param {*} gameContext 
     * @param {BattalionEntity} entity 
     * @param {number} tileX 
     * @param {number} tileY 
     * @returns {boolean}
     */
    isEntityDiscoveredByNeighborsAt: function(gameContext, entity, tileX, tileY) {
        const { world } = gameContext;
        const nearbyEntities = world.getEntitiesAround(tileX, tileY);

        for(let i = 0; i < nearbyEntities.length; i++) {
            if(!entity.isAllyWith(gameContext, nearbyEntities[i])) {
                if(!nearbyEntities[i].hasTrait(TRAIT_TYPE.NOT_SELECTABLE)) {
                    return true;
                }
            }
        } 

        return false;
    },
    /**
     * 
     * @param {*} gameContext 
     * @param {BattalionEntity} entity 
     * @param {number} tileX 
     * @param {number} tileY 
     * @returns {boolean}
     */
    isEntityDiscoveredByJammerAt: function(gameContext, entity, tileX, tileY) {
        //UNFAIR entities ignore jammers.
        if(entity.hasTrait(TRAIT_TYPE.UNFAIR)) {
            return false;
        }

        const { world } = gameContext;
        const { mapManager } = world;
        const worldMap = mapManager.getActiveMap();
        const cloakFlag = entity.config.getCloakFlag();

        return worldMap.isJammed(gameContext, tileX, tileY, entity.teamID, cloakFlag);
    },
    /**
     * 
     * @param {*} gameContext 
     * @param {BattalionEntity} entity 
     * @param {number} tileX 
     * @param {number} tileY 
     * @returns {boolean}
     */
    isEntityDiscoveredBySpawnerAt: function(gameContext, entity, tileX, tileY) {
        const { world, teamManager } = gameContext;
        const { mapManager } = world;
        const worldMap = mapManager.getActiveMap();
        const building = worldMap.getBuilding(tileX, tileY);
        const isSpotted = building && building.hasTrait(BUILDING_TRAIT.SPAWNER) && !teamManager.isAlly(entity.teamID, building.teamID);

        //Enemy stealth units must uncloak on a spawner as they'd leak information otherwise (spawning wouldn't work).
        return isSpotted;
    },
    /**
     * 
     * @param {*} gameContext 
     * @param {BattalionEntity} entity 
     * @returns {boolean}
     */
    isMineDiscoveredBy: function(gameContext, entity) {
        const { world, teamManager } = gameContext;
        const { mapManager } = world;
        const worldMap = mapManager.getActiveMap();
        const mine = worldMap.getMine(entity.tileX, entity.tileY);

        if(!mine) {
            return false;
        }

        return mine.isHidden() && !teamManager.isAlly(entity.teamID, mine.teamID);
    },
    /**
     * 
     * @param {*} gameContext 
     * @param {BattalionEntity} checker 
     * @returns {BattalionEntity[]}
     */
    getUncloakedEntities: function(gameContext, checker) {
        const { world, teamManager } = gameContext;
        const { mapManager, entityManager } = world;
        const worldMap = mapManager.getActiveMap();
        const jammerFlags = checker.config.getJammerFlags();
        const searchRange = jammerFlags !== JAMMER_FLAG.NONE ? checker.config.jammerRange : DEFAULT_ENTITY_SEARCH_RANGE;
        const uncloakedEntities = [];
        let shouldSelfUncloak = false;
    
        worldMap.fill2DGraph(checker.tileX, checker.tileY, searchRange, (tileX, tileY, tileD, tileI) => {
            const index = worldMap.getEntity(tileX, tileY);
            const entity = entityManager.getEntityByIndex(index);
    
            if(!entity) {
                return;
            }
    
            const distance = entity.getDistanceToTile(checker.tileX, checker.tileY);
    
            switch(distance) {
                case 0: {
                    //Distance 0 is the entity itself.
                    break;
                }
                case 1: {
                    //isEntityDiscoveredByNeighborsAt, but split up.
                    if(!teamManager.isAlly(checker.teamID, entity.teamID)) {
                        if(entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
                            uncloakedEntities.push(entity);
                        }
    
                        //Always uncloak next to an enemy that is not selectable!
                        if(!entity.hasTrait(TRAIT_TYPE.NOT_SELECTABLE)) {
                            shouldSelfUncloak = true;
                        }
                    }
                    break;
                }
                default: {
                    const cloakFlag = entity.config.getCloakFlag();
    
                    if(jammerFlags & cloakFlag) {
                        if(!entity.hasTrait(TRAIT_TYPE.UNFAIR) && !entity.isVisibleTo(gameContext, checker.teamID)) {
                            uncloakedEntities.push(entity);
                        }
                    }
                    break;
                }
            }
        });
    
        //Self uncloaking logic.
        if(checker.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
            if(shouldSelfUncloak || StealthSystem.isEntityDiscoveredByJammerAt(gameContext, checker, checker.tileX, checker.tileY) || StealthSystem.isEntityDiscoveredBySpawnerAt(gameContext, checker, checker.tileX, checker.tileY)) {
                uncloakedEntities.push(checker);
            }
        }
    
        return uncloakedEntities;
    },
    /**
     * 
     * @param {*} gameContext 
     * @param {BattalionEntity} checker 
     * @returns {Mine[]}
     */
    getUncloakedMines: function(gameContext, checker) {
        const { world, teamManager } = gameContext;
        const { mapManager } = world;
        const worldMap = mapManager.getActiveMap();
        const jammerFlags = checker.config.getJammerFlags();
        const searchRange = jammerFlags !== JAMMER_FLAG.NONE ? checker.config.jammerRange : DEFAULT_MINE_SEARCH_RANGE;
        const uncloakedMines = [];

        worldMap.fill2DGraph(checker.tileX, checker.tileY, searchRange, (tileX, tileY, distance, index) => {
            const mine = worldMap.getMine(tileX, tileY);

            if(mine && !mine.isVisibleTo(gameContext, checker.teamID)) {
                if(distance === 0 || mine.isJammed(jammerFlags)) {
                    uncloakedMines.push(mine);
                }
            }
        });

        return uncloakedMines;
    },
    /**
     * 
     * @param {*} gameContext 
     * @param {BattalionEntity} entity 
     * @param {number} tileX 
     * @param {number} tileY 
     * @returns {boolean}
     */
    canEntityCloakAt: function(gameContext, entity, tileX, tileY) {
        if(!entity.canCloak()) {
            return false;
        }

        if(StealthSystem.isEntityDiscoveredByJammerAt(gameContext, entity, tileX, tileY)) {
            return false;
        }

        if(StealthSystem.isEntityDiscoveredByNeighborsAt(gameContext, entity, tileX, tileY)) {
            return false;
        }

        if(StealthSystem.isEntityDiscoveredBySpawnerAt(gameContext, entity, tileX, tileY)) {
            return false;
        }

        return true;
    }
}