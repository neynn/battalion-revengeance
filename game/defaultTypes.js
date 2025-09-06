/**
 * @typedef {Object} SpawnConfigType
 * @property {string} type
 * @property {string} team
 * @property {string[] | string} owners
 * @property {int} tileX
 * @property {int} tileY
 * @property {int} [health]
 */

/**
 * @typedef {Object} ItemTransaction
 * @property {string} type
 * @property {string} id
 * @property {int} value
 */

/**
 * @typedef {Object} FireMissionType
 * @property {int} dimX
 * @property {int} dimY
 * @property {int} damage
 */

/**
 * @typedef {Object} AllianceType
 * @property {boolean} isWalkable
 * @property {boolean} isPassable
 * @property {boolean} isEnemy
 */

/**
 * @typedef {Object} DropType
 * @property {string} type
 * @property {string} id
 * @property {int} value
 */

/**
 * @typedef {Object} RewardType
 * @property {string} type
 * @property {string} id
 * @property {int} value
 * @property {int} [chance]
 */

/**
 * @typedef {Object} TargetObject
 * @property {int} id
 * @property {int} damage
 * @property {int} state
 */

/**
 * @type {AllianceType}
 */
export const DEFAULT_ALLIANCE = {
    "isWalkable": false,
    "isPassable": false,
    "isPlaceable": false,
    "isEnemy": false
};

/**
 * @type {FireMissionType}
 */
export const DEFAULT_FIRE_MISSION = {
    "dimX": 0,
    "dimY": 0,
    "damage": 0
}

export const DefaultTypes = function() {}

/**
 * 
 * @param {int} targetID 
 * @param {int} damage 
 * @param {int} state 
 * @returns {TargetObject}
 */
DefaultTypes.createTargetObject = function(targetID, damage, state) {
    return {
        "id": targetID,
        "damage": damage,
        "state": state
    }
}

/**
 * 
 * @param {string} type 
 * @param {string} teamID 
 * @param {string[] | string} owners 
 * @param {int} tileX 
 * @param {int} tileY 
 * @returns {SpawnConfigType}
 */
DefaultTypes.createSpawnConfig = function(type, teamID, owners, tileX, tileY) {
    return {
        "type": type,
        "team": teamID,
        "owners": owners,
        "tileX": tileX,
        "tileY": tileY
    }
}

/**
 * 
 * @param {string} type 
 * @param {string} id 
 * @param {int} value 
 * @returns {ItemTransaction}
 */
DefaultTypes.createItemTransaction = function(type, id, value) {
    return {
        "type": type,
        "id": id,
        "value": value
    }
}   

DefaultTypes.createDropContainer = function(drops, tileX, tileY) {
    return {
        "drops": drops,
        "tileX": tileX,
        "tileY": tileY
    }
}