export const EventComponent = function() {}

EventComponent.prototype.execute = function(gameContext) {
    console.error("execute is not defined for EventComponent!", this);
}