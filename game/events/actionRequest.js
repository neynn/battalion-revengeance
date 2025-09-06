import { ArmyEventHandler } from "../armyEventHandler.js";
import { CLIENT_EVENT } from "../enums.js";
import { ArmyEvent } from "./armyEvent.js";

export const ActionRequestEvent = function() {}

ActionRequestEvent.prototype = Object.create(ArmyEvent.prototype);
ActionRequestEvent.prototype.constructor = ActionRequestEvent;

ActionRequestEvent.prototype.onVersus = function(gameContext, event) {
    const { client, world } = gameContext;
    const { actionQueue } = world;
    const { socket } = client;

    const { request } = event;
    const { type } = request;
    const isSendable = actionQueue.isSendable(type);

    if(isSendable) {
        socket.messageRoom(CLIENT_EVENT.EVENT, request);
    }
}

ActionRequestEvent.prototype.onStory = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus } = world;
    const { request, choice } = event;

    if(choice && request) {
        eventBus.emit(ArmyEventHandler.TYPE.ACTION_AUTHORIZE, event);
    } else {
        eventBus.emit(ArmyEventHandler.TYPE.ACTION_DENY, event);
    }
}

ActionRequestEvent.createEvent = function(actorID, request = null, choice = null) {
    return {
        "actorID": actorID,
        "request": request,
        "choice": choice
    }
}