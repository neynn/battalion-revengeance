export const playUncloakSound = function(gameContext) {
    const { client } = gameContext;
    const { soundPlayer } = client;

    soundPlayer.play("uncloak");
}