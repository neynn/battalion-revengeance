export const Drop = function(transaction, inventory, sprite) {
    this.transaction = transaction;
    this.inventory = inventory;
    this.sprite = sprite;
    this.positionX = 0;
    this.positionY = 0;
    this.targetX = -1;
    this.targetY = -1;
    this.timePassed = 0;
    this.state = Drop.STATE.JUMPING;
}

Drop.TIME_UNTIL_COLLECTION = 10;

Drop.STATE = {
    JUMPING: 0,
    DROPPED: 1,
    COLLECTING_AUTO: 2,
    COLLECTING_CURSOR: 3,
    COLLECTED: 4
};

Drop.prototype.setPosition = function(x, y) {
    this.positionX = x;
    this.positionY = y;
}

Drop.prototype.collect = function() {
    this.inventory.addByTransaction(this.transaction);
}

Drop.prototype.update = function(mouseX, mouseY, mouseR, deltaTime) {
    switch(this.state) {
        case Drop.STATE.JUMPING: {
            this.timePassed += deltaTime;

            if(this.timePassed >= 1) {
                //Jump 2 times with reducing intensity until the target is reached.
                this.state = Drop.STATE.DROPPED;
                this.timePassed = 0;
            }
            break;
        }
        case Drop.STATE.DROPPED: {
            this.timePassed += deltaTime;

            if(this.timePassed >= Drop.TIME_UNTIL_COLLECTION) {
                this.collect();
                this.state = Drop.STATE.COLLECTING_AUTO;
                this.targetX = -1; //Anywhere outside the screen
                this.targetY = -1; //Anywhere outside the screen
            } else {
                const isColliding = this.sprite.isCollidingStatic(this.positionX, this.positionY, mouseX, mouseY, mouseR, mouseR);

                if(isColliding) {
                    this.collect();
                    this.state = Drop.STATE.COLLECTING_CURSOR;
                }
            }

            break;
        }
        case Drop.STATE.COLLECTING_AUTO: {
            //If the cursor did not collect it.
            //Move linearly to the target.
            //If target is reached, collect and put to collected.
            this.state = Drop.STATE.COLLECTED;
            break;
        }
        case Drop.STATE.COLLECTING_CURSOR: {
            //If the cursor collected it.
            //Show the value and name of the item.
            //After some time, put to collected.
            this.state = Drop.STATE.COLLECTED;
            break;
        }
    }
}