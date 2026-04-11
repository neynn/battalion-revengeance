import { Action } from "../../../engine/action/action.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { TEAM_STAT, TRAIT_TYPE } from "../../enums.js";
import { playUncloakSound } from "../../systems/sound.js";
import { UncloakTween } from "../../tween/uncloakTween.js";
import { createTrackingIntent } from "../actionHelper.js";

export const UncloakAction = function() {
    Action.call(this);

    this.tweens = [];
}

UncloakAction.createData = function() {
    return {
        "entityID": EntityManager.INVALID_ID,
        "entities": [],
        "mines": []
    }
}

UncloakAction.prototype = Object.create(Action.prototype);
UncloakAction.prototype.constructor = UncloakAction;

UncloakAction.prototype.onStart = function(gameContext, data) {
    const { world, tweenManager } = gameContext;
    const { entityManager, mapManager } = world;
    const { entities, mines } = data;
    const worldMap = mapManager.getActiveMap();

    playUncloakSound(gameContext);

    for(let i = 0; i < entities.length; i++) {
        const entity = entityManager.getEntity(entities[i]);
        const tween = new UncloakTween(entity);

        this.tweens.push(tween);
        tweenManager.addTween(tween);
    }

    for(let i = 0; i < mines.length; i++) {
        const { x, y } = mines[i];
        const mine = worldMap.getMine(x, y);
        const tween = new UncloakTween(mine);

        this.tweens.push(tween);
        tweenManager.addTween(tween);
    }
}

UncloakAction.prototype.isFinished = function(gameContext, executionPlan) {
    let isFinished = true;

    for(const tween of this.tweens) {
        if(!tween.isComplete()) {
            isFinished = false;
            break;
        }
    }

    return isFinished;
}

UncloakAction.prototype.onEnd = function(gameContext, data) {
    this.tweens.length = 0;
    this.execute(gameContext, data);
}

UncloakAction.prototype.execute = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager, mapManager } = world;
    const { entities, mines, entityID } = data;
    const worldMap = mapManager.getActiveMap();
    const entity = entityManager.getEntity(entityID);
    const team = entity.getTeam(gameContext);

    for(const entityID of entities) {
        const entity = entityManager.getEntity(entityID);

        entity.setUncloaked();
    }

    for(const { x, y } of mines) {
        const mine = worldMap.getMine(x, y);

        mine.show();
    }

    team.addStatistic(TEAM_STAT.MINES_DISCOVERED, mines.length);
}

UncloakAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = actionIntent;
    const entity = entityManager.getEntity(entityID);

    if(!entity || entity.isDead()) {
        return;
    }

    const uncloakedMines = entity.getUncloakedMines(gameContext);
    const uncloakedEntities = entity.getUncloakedEntities(gameContext);

    if(uncloakedEntities.length === 0 && uncloakedMines.length === 0) {
        return;
    }

    if(uncloakedEntities.length !== 0 && entity.hasTrait(TRAIT_TYPE.TRACKING)) {
        executionPlan.addNext(createTrackingIntent(entity, uncloakedEntities));
    }

    const data = UncloakAction.createData();

    data.entityID = entityID;
    
    for(const entity of uncloakedEntities) {
        data.entities.push(entity.getID());
    }

    for(const mine of uncloakedMines) {
        data.mines.push(mine.positionToJSON());
    }

    executionPlan.setData(data);
}