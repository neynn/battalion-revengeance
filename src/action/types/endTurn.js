import { Action } from "../../../engine/action/action.js";

export const EndTurnAction = function() {
    Action.call(this);
}

EndTurnAction.prototype = Object.create(Action.prototype);
EndTurnAction.prototype.constructor = EndTurnAction;

EndTurnAction.prototype.onStart = function(gameContext, data, id) {

}

EndTurnAction.prototype.onUpdate = function(gameContext, data, id) {

}

EndTurnAction.prototype.isFinished = function(gameContext, executionRequest) {

}

EndTurnAction.prototype.onEnd = function(gameContext, data, id) {

}

EndTurnAction.prototype.validate = function(gameContext, executionRequest, requestData) {

}