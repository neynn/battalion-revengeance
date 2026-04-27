import { Action } from "../../../engine/action/action.js";
import { ActionIntent } from "../../../engine/action/actionIntent.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { ACTION_TYPE, COMMAND_TYPE, TEAM_STAT, TRAIT_TYPE } from "../../enums.js";
import { playUncloakSound } from "../../systems/sound.js";
import { UncloakTween } from "../../tween/uncloakTween.js";
import { AttackActionVTable } from "./attack.js";

const createUncloakIntent = function(entityID) {
    return new ActionIntent(ACTION_TYPE.UNCLOAK, {
        "entityID": entityID
    });
}

const createUncloakData = function() {
    return {
        "entityID": EntityManager.INVALID_ID,
        "entities": [],
        "mines": []
    }
}

const fillUncloakPlan = function(gameContext, executionPlan, actionIntent) {
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
        const entityID = entity.getID();
        const targetID = uncloakedEntities[0].getID();

        executionPlan.addNext(AttackActionVTable.createIntent(entityID, targetID, COMMAND_TYPE.ATTACK));
    }

    const data = createUncloakData();

    data.entityID = entityID;
    
    for(const entity of uncloakedEntities) {
        data.entities.push(entity.getID());
    }

    for(const mine of uncloakedMines) {
        data.mines.push(mine.positionToJSON());
    }

    executionPlan.setData(data);
}

const executeUncloak = function(gameContext, data) {
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

export const UncloakVTable = {
    createIntent: createUncloakIntent,
    createData: createUncloakData,
    fillPlan: fillUncloakPlan,
    execute: executeUncloak
};

export const UncloakAction = function() {
    Action.call(this);

    this.tweens = [];
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
}