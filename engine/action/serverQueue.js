const MAX_ACTIONS_PER_TICK = 1000;

const enableServerQueue = function(gameContext) {
    const { world } = gameContext;
    const { actionQueue } = world;

    actionQueue.toFlush();
}

const updateActionQueue = function(gameContext) {
    const { world } = gameContext;
    const { actionQueue } = world;
    let count = 0;

    while(count < MAX_ACTIONS_PER_TICK && !actionQueue.isEmpty()) {
        actionQueue.update(gameContext);
        count++;
    }
}

const processUserRequest = function(gameContext, request, messengerID) {
    const { world } = gameContext;
    const { actionQueue } = world;
    /*
        Perform IS_MESSENGER_ACTOR check.
        Map messengerID to actorID. If IS_MESSENGER_ACTOR && (!request.data.actorID || IS_ACTOR(request.data.actorID);
    */
    const executionPlan = actionQueue.createExecutionPlan(gameContext, request);

    if(executionPlan) {
        actionQueue.enqueue(executionPlan);
        updateActionQueue(gameContext);
    }
}