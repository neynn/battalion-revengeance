import { Action } from "../../../engine/action/action.js";

export const DialogueAction = function() {
    Action.call(this);
}

DialogueAction.prototype = Object.create(Action.prototype);
DialogueAction.prototype.constructor = DialogueAction;

DialogueAction.prototype.onStart = function(gameContext, data, id) {

}

DialogueAction.prototype.onUpdate = function(gameContext, data, id) {

}

DialogueAction.prototype.isFinished = function(gameContext, executionRequest) {

}

DialogueAction.prototype.onEnd = function(gameContext, data, id) {

}

DialogueAction.prototype.validate = function(gameContext, executionRequest, requestData) {

}