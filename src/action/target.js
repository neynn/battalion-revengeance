export const Target = function(entityID, state) {
    this.entityID = entityID;
    this.state = state;
}

Target.STATE = {
    ALIVE: 0,
    DEAD: 1
};