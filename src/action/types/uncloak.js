import { Action } from "../../../engine/action/action.js";
import { FADE_RATE } from "../../constants.js";
import { TEAM_STAT, TRAIT_TYPE } from "../../enums.js";
import { playUncloakSound } from "../../systems/sound.js";
import { createTrackingIntent } from "../actionHelper.js";

export const UncloakAction = function() {
    Action.call(this);

    this.opacity = 0;
    this.entities = [];
    this.mines = [];
}

UncloakAction.prototype = Object.create(Action.prototype);
UncloakAction.prototype.constructor = UncloakAction;

UncloakAction.prototype.onStart = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager, mapManager } = world;
    const { entities, mines } = data;
    const worldMap = mapManager.getActiveMap();

    playUncloakSound(gameContext);

    for(let i = 0; i < entities.length; i++) {
        const entity = entityManager.getEntity(entities[i]);

        this.entities.push(entity);
    }

    for(let i = 0; i < mines.length; i++) {
        const { x, y } = mines[i];
        const mine = worldMap.getMine(x, y);

        this.mines.push(mine);
    }
}

UncloakAction.prototype.onUpdate = function(gameContext, data) {
    const { timer } = gameContext;
    const fixedDeltaTime = timer.getFixedDeltaTime();

    this.opacity += FADE_RATE * fixedDeltaTime;

    if(this.opacity > 1) {
        this.opacity = 1;
    }

    for(const entity of this.entities) {
        entity.setOpacity(this.opacity);
    }

    for(const mine of this.mines) {
        mine.opacity = this.opacity;
    }
}

UncloakAction.prototype.isFinished = function(gameContext, executionPlan) {
    return this.opacity >= 1;
}

UncloakAction.prototype.onEnd = function(gameContext, data) {
    this.execute(gameContext, data);

    for(const entity of this.entities) {
        entity.setOpacity(1);
    }

    for(const mine of this.mines) {
        mine.opacity = 1;
    }

    this.entities.length = 0;
    this.mines.length = 0;
    this.opacity = 0;
}

UncloakAction.prototype.execute = function(gameContext, data) {
    const { world, teamManager } = gameContext;
    const { entityManager, mapManager } = world;
    const { entities, mines, teamID } = data;
    const worldMap = mapManager.getActiveMap();
    const team = teamManager.getTeam(teamID);

    for(let i = 0; i < entities.length; i++) {
        const entity = entityManager.getEntity(entities[i]);

        entity.setUncloaked();
    }

    for(let i = 0; i < mines.length; i++) {
        const { x, y } = mines[i];
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

    const { teamID } = entity;
    const uncloakedMines = entity.getUncloakedMines(gameContext);
    const uncloakedEntities = entity.getUncloakedEntitiesAtSelf(gameContext);

    if(uncloakedEntities.length !== 0 && entity.hasTrait(TRAIT_TYPE.TRACKING)) {
        executionPlan.addNext(createTrackingIntent(entity, uncloakedEntities));
    }

    if(uncloakedEntities.length === 0 && uncloakedMines.length === 0) {
        return;
    }

    executionPlan.setData({
        "teamID": teamID,
        "entities": uncloakedEntities.map(e => e.getID()),
        "mines": uncloakedMines.map(m => m.positionToJSON())
    });
}