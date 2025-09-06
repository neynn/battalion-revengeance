export const UnitLimitSystem = function() {}

UnitLimitSystem.addEntity = function(gameContext, entity) {
    const cost = entity.config.cost;

    if(!cost) {
        return;
    }

    const { world } = gameContext;
    const { turnManager } = world;
    const owners = turnManager.getOwnersOf(entity.getID());

    for(let i = 0; i < owners.length; i++) {
        const actor = owners[i];
        const limits = actor.limits;

        if(limits) {
            limits.addByCost(cost);
        }
    }
}

UnitLimitSystem.removeEntity = function(gameContext, entity) {
    const cost = entity.config.cost;

    if(!cost) {
        return;
    }

    const { world } = gameContext;
    const { turnManager } = world;
    const owners = turnManager.getOwnersOf(entity.getID());

    for(let i = 0; i < owners.length; i++) {
        const actor = owners[i];
        const limits = actor.limits;

        if(limits) {
            limits.removeByCost(cost);
        }
    }
}