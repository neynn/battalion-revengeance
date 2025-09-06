import { ConstructionAction } from "../actions/constructionAction.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { SpawnSystem } from "./spawn.js";

/**
 * Collection of functions revolving around the construction of buildings.
 */
export const ConstructionSystem = function() {}

/**
 * Creates a build request for the entity or finishes up construction.
 * TODO: Create confirmation dialog & isolate to game event.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 * @param {string} actorID 
 * @returns {ConstructionRequest | null}
 */
ConstructionSystem.onInteract = function(gameContext, entity, actorID) {
    const constructionComponent = entity.getComponent(ArmyEntity.COMPONENT.CONSTRUCTION);

    if(!constructionComponent) {
        return null;
    }
    
    const { world } = gameContext;
    const { actionQueue } = world;
    
    if(entity.isConstructionComplete()) {
        if(!actionQueue.isRunning()) {
            const willBuild = confirm(`Finish construction?`);

            if(willBuild) {
                const result = entity.getConstructionResult(gameContext);

                SpawnSystem.destroyEntity(gameContext, entity);
                SpawnSystem.createEntity(gameContext, result);
            }
        }
    } else {
        const entityID = entity.getID();
        const request = ConstructionAction.createRequest(actorID, entityID);

        return request;
    }

    return null;
}