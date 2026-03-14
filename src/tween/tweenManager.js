import { Tween } from "./tween.js";

export const TweenManager = function() {
    this.tweens = [];
}

TweenManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const { deltaTime } = timer;
    let isTweened = false;

    for(let i = 0; i < this.tweens.length; i++) {
        const tween = this.tweens[i];
        const { waitType, state } = tween;

        if(state === Tween.STATE.RUNNING) {
            switch(waitType) {
                case Tween.WAIT_TYPE.SEQUENTIAL: {
                    if(!isTweened) {
                        tween.timePassed += deltaTime;
                        tween.update(gameContext);
                        isTweened = true;
                    }

                    break;
                }
                case Tween.WAIT_TYPE.SEQUENTIAL_ALL: {
                    tween.timePassed += deltaTime;
                    tween.update(gameContext);
                    isTweened = true;
                    break;
                }
                case Tween.WAIT_TYPE.PARALLEL: {
                    tween.timePassed += deltaTime;
                    tween.update(gameContext);
                    break;
                }
            }
        }
    }

    for(let i = this.tweens.length - 1; i >= 0; i--) {
        const { state, timePassed } = this.tweens[i];

        //Automatically end tweens after 10s.
        if(state === Tween.STATE.COMPLETE || timePassed >= 10) {
            this.tweens.splice(i, 1);
        }
    }
}

TweenManager.prototype.exit = function() {
    this.tweens.length = 0;
}

TweenManager.prototype.addTween = function(tween) {
    this.tweens.push(tween);
}

TweenManager.prototype.isEmpty = function() {
    return this.tweens.length === 0;
}