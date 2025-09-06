/**
 * Collection of functions revolving around the alliances.
 */
export const AllianceSystem = function() {}

/**
 * Returns if teamA can bypass teamB.
 * 
 * @param {ArmyContext} gameContext 
 * @param {string} actorTeamID 
 * @param {string} reactorTeamID 
 * @returns {boolean}
 */
AllianceSystem.isPassable = function(gameContext, actorTeamID, reactorTeamID) {
    return gameContext.getAlliance(actorTeamID, reactorTeamID).isPassable;
}

/**
 * Returns if teamA can walk on the tiles of teamB.
 * 
 * @param {ArmyContext} gameContext 
 * @param {string} actorTeamID 
 * @param {string} reactorTeamID 
 * @returns {boolean}
 */
AllianceSystem.isWalkable = function(gameContext, actorTeamID, reactorTeamID) {
    return gameContext.getAlliance(actorTeamID, reactorTeamID).isWalkable;
}

/**
 * Returns if teamA is an enemy of teamB.
 * 
 * @param {ArmyContext} gameContext 
 * @param {string} actorTeamID 
 * @param {string} reactorTeamID 
 * @returns {boolean}
 */
AllianceSystem.isEnemy = function(gameContext, actorTeamID, reactorTeamID) {
    return gameContext.getAlliance(actorTeamID, reactorTeamID).isEnemy;
}

/**
 * Returns if teamA can place on teamB.
 * 
 * @param {ArmyContext} gameContext 
 * @param {string} actorTeamID 
 * @param {string} reactorTeamID 
 * @returns {boolean}
 */
AllianceSystem.isPlaceable = function(gameContext, actorTeamID, reactorTeamID) {
    return gameContext.getAlliance(actorTeamID, reactorTeamID).isPlaceable;
}