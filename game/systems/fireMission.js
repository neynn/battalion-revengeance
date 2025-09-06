import { DefaultTypes } from "../defaultTypes.js";
import { ArmyEventHandler } from "../armyEventHandler.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { AttackSystem } from "./attack.js";
import { DebrisSystem } from "./debris.js";
import { DebrisSpawnEvent } from "../events/debrisSpawn.js";

/**
 * Collection of functions revolving around the fire missions.
 */
export const FireMissionSystem = function() {}

/**
 * Checks if the entity is targetable by any fire mission.
 * 
 * @param {*} entity 
 * @returns {boolean}
 */
FireMissionSystem.isTargetable = function(entity) {
    if(entity.hasComponent(ArmyEntity.COMPONENT.TOWN) || !entity.isAlive()) {
        return false;
    }

    return true;
}

/**
 * Returns a list of all potential targets hit by the fire mission.
 * 
 * @param {*} gameContext 
 * @param {FireMissionType} fireMission 
 * @param {int} tileX 
 * @param {int} tileY 
 * @returns {TargetObject[]}
 */
FireMissionSystem.getTargets = function(gameContext, fireMission, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager, entityManager } = world;
    const worldMap = mapManager.getActiveMap();
    const targetObjects = [];

    if(!worldMap) {
        return targetObjects;
    }

    const { damage, dimX, dimY, isBulldozing } = fireMission;
    const endX = tileX + dimX;
    const endY = tileY + dimY;
    const entityList = new Map();

    for(let i = tileY; i < endY; i++) {
        for(let j = tileX; j < endX; j++) {
            const isFullyClouded = worldMap.isFullyClouded(j, i);

            if(isFullyClouded) {
                continue;
            }

            const entityID = worldMap.getTopEntity(j, i);
            const entity = entityManager.getEntity(entityID);

            if(!entity) {
                continue;
            }

            const isTargetable = FireMissionSystem.isTargetable(entity);
            const isAlive = entity.isAlive();

            if(isTargetable && isAlive) {
                const currentDamage = damage; //TODO Calculate the damage.
                const entry = entityList.get(entityID);
    
                if(!entry) {
                    entityList.set(entityID, {
                        "entity": entity,
                        "damage": currentDamage
                    });
                } else {
                    entry.damage += currentDamage;
                }
            }
        }
    }
    
    for(const [entityID, entry] of entityList) {
        const { entity, damage } = entry;

        if(damage !== 0) {
            const targetState = AttackSystem.getState(entity, damage, isBulldozing);
            const targetObject = DefaultTypes.createTargetObject(entityID, damage, targetState);
    
            targetObjects.push(targetObject);
        }
    }

    return targetObjects;
}

/**
 * Checks if the fire mission is blocked by the clouds or an entity.
 * 
 * @param {*} gameContext 
 * @param {FireMissionType} fireMission 
 * @param {int} tileX 
 * @param {int} tileY 
 * @returns {boolean}
 */
FireMissionSystem.isBlocked = function(gameContext, fireMission, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return true;
    }

    let fullyClouded = true;
    const { dimX, dimY } = fireMission;
    const endX = tileX + dimX;
    const endY = tileY + dimY;

    for(let i = tileY; i < endY; i++) {
        for(let j = tileX; j < endX; j++) {
            const tileEntity = world.getTileEntity(j, i);

            if(tileEntity && !FireMissionSystem.isTargetable(tileEntity)) {
                return true;
            }

            const isFullyClouded = worldMap.isFullyClouded(j, i);

            if(!isFullyClouded) {
                fullyClouded = false;
            }
        }
    }

    return fullyClouded;
}

/**
 * Starts a fire mission.
 *  
 * @param {*} gameContext 
 * @param {string} missionID 
 * @param {int} tileX 
 * @param {int} tileY 
 * @param {TargetObject[]} targetObjects 
 */
FireMissionSystem.startFireMission = function(gameContext, missionID, tileX, tileY, targetObjects) {
    const { client } = gameContext;
    const { soundPlayer } = client;
    const fireMission = gameContext.getFireMissionType(missionID);
    
    for(let i = 0; i < targetObjects.length; i++) {
        AttackSystem.startAttack(gameContext, targetObjects[i]);
    }

    soundPlayer.play(fireMission.sounds.fire);
}

/**
 * Ends a fire mission. Emits an event for each target based on its state.
 * Also emite the DEBRIS_SPAWN event.
 * 
 * @param {*} gameContext 
 * @param {string} missionID 
 * @param {string} actorID 
 * @param {int} tileX 
 * @param {int} tileY 
 * @param {TargetObject[]} targetObjects 
 */
FireMissionSystem.endFireMission = function(gameContext, missionID, actorID, tileX, tileY, targetObjects) {
    const { world } = gameContext;
    const { eventBus } = world;

    for(let i = 0; i < targetObjects.length; i++) {
        AttackSystem.updateTarget(gameContext, targetObjects[i], actorID, ArmyEventHandler.KILL_REASON.FIRE_MISSION);
    }

    const fireMission = gameContext.getFireMissionType(missionID);
    const { dimX, dimY } = fireMission;
    const debris = DebrisSystem.getDebrisSpawnLocations(gameContext, tileX, tileY, dimX, dimY);

    if(debris.length !== 0) {
        eventBus.emit(ArmyEventHandler.TYPE.DEBRIS_SPAWN, DebrisSpawnEvent.createEvent(debris));
    }
}