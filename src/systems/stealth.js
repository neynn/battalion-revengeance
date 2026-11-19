import { JAMMER_TILES_NO_NEIGHBORS, JAMMER_TILES_WITH_NEIGHBORS, UNIT_MAX_JAMMER_RANGE } from "../constants.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { Mine } from "../entity/mine.js";
import { BUILDING_TRAIT, DIRECTION, JAMMER_FLAG, TRAIT_TYPE } from "../enums.js";
import { DIRECTION_DELTA_X, DIRECTION_DELTA_Y } from "./direction.js";

const DEFAULT_MINE_SEARCH_RANGE = 0;
const DEFAULT_ENTITY_SEARCH_RANGE = 0;

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
        const worldMap = world.getWorldMap();
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
        const worldMap = world.getWorldMap();
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
        const worldMap = world.getWorldMap();
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
        const { entityManager } = world;
        const worldMap = world.getWorldMap();
        const uncloakedEntities = [];
        let shouldSelfUncloak = false;
    
        //Always check the four neighboring cardinal tiles.
        for(let i = 0; i < DIRECTION._COUNT; i++) {
            const tileX = checker.tileX + DIRECTION_DELTA_X[i];
            const tileY = checker.tileY + DIRECTION_DELTA_Y[i];
            const index = worldMap.getEntity(tileX, tileY);
            const entity = entityManager.getEntityByIndex(index);

            if(entity) {
                if(!teamManager.isAlly(checker.teamID, entity.teamID)) {
                    if(entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
                        uncloakedEntities.push(entity);
                    }

                    //Always uncloak next to an enemy that is not selectable!
                    if(!entity.hasTrait(TRAIT_TYPE.NOT_SELECTABLE)) {
                        shouldSelfUncloak = true;
                    }
                }
            }
        }

        //Check for entities in jammer range. Jammer check only makes sense if the distance if bigger than 1 because
        //0 is self and 1 is the neighbors that always get uncloaked.
        const jammerFlags = checker.config.getJammerFlags();
        const searchRange = jammerFlags !== JAMMER_FLAG.NONE ? checker.config.jammerRange : DEFAULT_ENTITY_SEARCH_RANGE;
        const searchDeltas = JAMMER_TILES_NO_NEIGHBORS[searchRange];

        for(let i = 0; i < searchDeltas.length; i += 3) {
            const tileX = checker.tileX + searchDeltas[i];
            const tileY = checker.tileY + searchDeltas[i + 1];
            const index = worldMap.getEntity(tileX, tileY);
            const entity = entityManager.getEntityByIndex(index);

            if(entity) {
                const cloakFlag = entity.config.getCloakFlag();

                if(jammerFlags & cloakFlag) {
                    if(!entity.hasTrait(TRAIT_TYPE.UNFAIR) && !entity.isVisibleTo(gameContext, checker.teamID)) {
                        uncloakedEntities.push(entity);
                    }
                }
            }
        }
    
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
        const worldMap = world.getWorldMap();
        const uncloakedMines = [];

        const jammerFlags = checker.config.getJammerFlags();
        const searchRange = jammerFlags !== JAMMER_FLAG.NONE ? checker.config.jammerRange : DEFAULT_MINE_SEARCH_RANGE;
        const searchDeltas = JAMMER_TILES_WITH_NEIGHBORS[searchRange];

        //Check for all mines in scanning area.
        //Alaways uncloak an enemy mine the unit is standing on!
        for(let i = 0; i < searchDeltas.length; i += 3) {
            const tileX = checker.tileX + searchDeltas[i];
            const tileY = checker.tileY + searchDeltas[i + 1];
            const mine = worldMap.getMine(tileX, tileY);

            if(mine && !mine.isVisibleTo(gameContext, checker.teamID)) {
                const distance = searchDeltas[i + 2];

                if(distance === 0 || mine.isJammed(jammerFlags)) {
                    uncloakedMines.push(mine);
                }
            }
        }

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