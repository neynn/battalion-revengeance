export const EffectComponent = function() {}

EffectComponent.prototype.isFinished = function(gameContext) {
    return true;
}

EffectComponent.prototype.play = function(gameContext) {
    console.error("play is not defined for EffectComponent!", this);
}