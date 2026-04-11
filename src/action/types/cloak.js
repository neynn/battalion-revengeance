import { Action } from "../../../engine/action/action.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { SOUND_TYPE } from "../../enums.js";
import { playEntitySound } from "../../systems/sound.js";
import { CloakTween } from "../../tween/cloakTween.js";

export const CloakAction = function() {
    Action.call(this);

    this.tweens = [];
}

CloakAction.createData = function() {
    return {
        "entityID": EntityManager.INVALID_ID
    }
}

CloakAction.prototype = Object.create(Action.prototype);
CloakAction.prototype.constructor = CloakAction;

CloakAction.prototype.onStart = function(gameContext, data) {
    const { world, tweenManager } = gameContext;
    const { entityManager } = world;
    const { entityID } = data;
    const entity = entityManager.getEntity(entityID);
    const tween = new CloakTween(entity);

    playEntitySound(gameContext, entity, SOUND_TYPE.CLOAK);

    tweenManager.addTween(tween);

    this.tweens.push(tween);
    this.execute(gameContext, data);
}

CloakAction.prototype.isFinished = function(gameContext, executionPlan) {
    let isFinished = true;

    for(const tween of this.tweens) {
        if(!tween.isComplete()) {
            isFinished = false;
            break;
        }
    }

    return isFinished;
}

CloakAction.prototype.execute = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = data;
    const entity = entityManager.getEntity(entityID);

    entity.setCloaked();
}

CloakAction.prototype.onEnd = function(gameContext, data) {
    this.tweens.length = 0;
}

CloakAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = actionIntent;
    const entity = entityManager.getEntity(entityID);

    if(!entity || !entity.canCloakAtSelf(gameContext)) {
        return;
    }

    const data = CloakAction.createData();

    data.entityID = entityID;

    executionPlan.setData(data);
}