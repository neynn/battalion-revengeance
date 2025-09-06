const enableServerQueue = function(gameContext) {
    const { world } = gameContext;
    const { actionQueue } = world;

    actionQueue.toFlush();
}

const processUserRequest = function(gameContext, request, messengerID) {
    const { world } = gameContext;
    const { actionQueue } = world;
    /*
        Perform IS_MESSENGER_ACTOR check.
        Map messengerID to actorID. If IS_MESSENGER_ACTOR && (!request.data.actorID || IS_ACTOR(request.data.actorID);
    */
    const executionRequest = actionQueue.createExecutionRequest(gameContext, request);

    if(!executionRequest) {
        return;
    }

    actionQueue.enqueue(executionRequest);

    const processNext = () => {
        if(!actionQueue.isEmpty()) {
            actionQueue.update(gameContext);
            setTimeout(processNext, 0);
        }
    };

    processNext();
}