import { ArmyEntity } from "../init/armyEntity.js";

/**
 * Collection of functions revolving around the movement of entities.
 */
export const MoveSystem = function() {}

MoveSystem.SPEED = {
    STRAIGHT: 1,
    CROSS: Math.SQRT2
};

/**
 * Lets the entity follow its current movement path.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 * @returns 
 */
MoveSystem.updatePath = function(gameContext, entity) {
    const { timer, transform2D } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();
    const moveComponent = entity.getComponent(ArmyEntity.COMPONENT.MOVE);

    if(moveComponent.isPathDone()) {
        return;
    }

    const { deltaX, deltaY } = moveComponent.getCurrentStep();
    const distance = moveComponent.updateDistance(deltaTime, MoveSystem.SPEED.STRAIGHT, MoveSystem.SPEED.CROSS);

    entity.updateSpritePosition(deltaX * distance, deltaY * distance);
    
    while(moveComponent.canPathAdvance(gameContext.settings.travelDistance)) {
        const { deltaX, deltaY } = moveComponent.getCurrentStep();
        const tileX = entity.tileX + deltaX;
        const tileY = entity.tileY + deltaY;
        const { x, y } = transform2D.transformTileToWorldCenter(tileX, tileY);

        entity.setTile(tileX, tileY);
        entity.setSpritePosition(x, y);
        moveComponent.advancePath(gameContext.settings.travelDistance);
    }
}

/**
 * Ends the moving action and puts the entity on the specified position.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 * @param {int} targetX 
 * @param {int} targetY 
 */
MoveSystem.endMove = function(gameContext, entity, targetX, targetY) {
    const { transform2D } = gameContext;
    const { x, y } = transform2D.transformTileToWorldCenter(targetX, targetY);
    const moveComponent = entity.getComponent(ArmyEntity.COMPONENT.MOVE);

    moveComponent.clearPath();

    entity.setTile(targetX, targetY);
    entity.setSpritePosition(x, y);
}