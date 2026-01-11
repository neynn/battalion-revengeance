export const playUncloakSound = function(gameContext) {
    const { client } = gameContext;
    const { soundPlayer } = client;

    soundPlayer.play("uncloak");
}

export const playSFX = function(gameContext, soundID) {
    const { client } = gameContext;
    const { soundPlayer } = client;

    soundPlayer.play(soundID);
}