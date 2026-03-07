import { Action } from "../../../engine/action/action.js";
import { SOUND_TYPE } from "../../enums.js";
import { playEntitySound } from "../../systems/sound.js";
import { updateEntitySprite } from "../../systems/sprite.js";
import { CloakTween } from "../../tween/types/cloakTween.js";
import { UncloakTween } from "../../tween/types/uncloakTween.js";

export const ToTransportAction = function() {
    Action.call(this);
}

ToTransportAction.prototype = Object.create(Action.prototype);
ToTransportAction.prototype.constructor = ToTransportAction;

ToTransportAction.prototype.onStart = function(gameContext, data) {
    const { world, tweenManager } = gameContext;
    const { entityManager } = world;
    const { entityID } = data;
    const entity = entityManager.getEntity(entityID);

    playEntitySound(gameContext, entity, SOUND_TYPE.CLOAK);

    tweenManager.addTween(new CloakTween(entity, 0.5));

    this.execute(gameContext, data);
}

ToTransportAction.prototype.isFinished = function(gameContext, executionPlan) {
    const { tweenManager } = gameContext;

    return tweenManager.isEmpty();
}

ToTransportAction.prototype.onEnd = function(gameContext, data) {
    const { world, tweenManager } = gameContext;
    const { entityManager } = world;
    const { entityID } = data;
    const entity = entityManager.getEntity(entityID);

    updateEntitySprite(gameContext, entity);

    tweenManager.addTween(new UncloakTween(entity, 1));
}

ToTransportAction.prototype.execute = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = data;
    const entity = entityManager.getEntity(entityID);

    //TODO(neyn): Set Transport!
}

ToTransportAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = actionIntent;
    const entity = entityManager.getEntity(entityID);

    if(!entity) {
        return;
    }
}