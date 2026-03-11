import { Graph } from "../graphics/graph.js";

export const Widget = function() {
    Graph.call(this);

    this.anchor = Widget.ANCHOR.TOP_LEFT;
    this.originX = 0;
    this.originY = 0;
}

Widget.ANCHOR = {
    NONE: 0,
    TOP_CENTER: 1,
    TOP_LEFT: 2,
    TOP_RIGHT: 3,
    BOTTOM_CENTER: 4,
    BOTTOM_LEFT: 5,
    BOTTOM_RIGHT: 6,
    CENTER: 7,
    LEFT: 8,
    RIGHT: 9,
    PERCENT: 10
};

Widget.prototype = Object.create(Graph.prototype);
Widget.prototype.constructor = Widget;

Widget.prototype.setOrigin = function(originX, originY) {
    this.originX = originX;
    this.originY = originY;
}

Widget.prototype.anchorInWindow = function(windowWidth, windowHeight) {
    switch(this.anchor) {
        case Widget.ANCHOR.NONE: {
            break;
        }
        case Widget.ANCHOR.TOP_CENTER: {
            const anchorX = windowWidth / 2 - this.width / 2 + this.originX;

            this.setPosition(anchorX, this.originY);
            break;
        }
        case Widget.ANCHOR.TOP_LEFT: {
            this.setPosition(this.originX, this.originY);
            break;
        }
        case Widget.ANCHOR.TOP_RIGHT: {
            const anchorX = windowWidth - this.width - this.originX;

            this.setPosition(anchorX, this.originY);
            break;
        }
        case Widget.ANCHOR.BOTTOM_LEFT: {
            const anchorY = windowHeight - this.height - this.originY;

            this.setPosition(this.originX, anchorY);
            break;
        }
        case Widget.ANCHOR.BOTTOM_CENTER: {
            const anchorX = windowWidth / 2 - this.width / 2 + this.originX;
            const anchorY = windowHeight - this.height - this.originY;

            this.setPosition(anchorX, anchorY);
            break;
        }
        case Widget.ANCHOR.BOTTOM_RIGHT: {
            const anchorX = windowWidth - this.width - this.originX;
            const anchorY = windowHeight - this.height - this.originY;

            this.setPosition(anchorX, anchorY);
            break;
        }
        case Widget.ANCHOR.LEFT: {
            const anchorY = windowHeight / 2 - this.height / 2 + this.originY;

            this.setPosition(this.originX, anchorY);
            break;
        }
        case Widget.ANCHOR.CENTER: {
            const anchorX = windowWidth / 2 - this.width / 2 + this.originX;
            const anchorY = windowHeight / 2 - this.height / 2 + this.originY;

            this.setPosition(anchorX, anchorY);
            break;
        }
        case Widget.ANCHOR.RIGHT: {
            const anchorX = windowWidth - this.width - this.originX;
            const anchorY = windowHeight / 2 - this.height / 2 + this.originY;

            this.setPosition(anchorX, anchorY);
            break;
        }
        case Widget.ANCHOR.PERCENT: {
            const percentX = clampValue(this.originX, 100, 0);
            const percentY = clampValue(this.originY, 100, 0);

            const shiftX = Math.floor((percentX / 100) * windowWidth - this.width / 2);
            const shiftY = Math.floor((percentY / 100) * windowHeight - this.height / 2);

            const anchorX = clampValue(shiftX, windowWidth - this.width, 0);
            const anchorY = clampValue(shiftY, windowHeight - this.height, 0);

            this.setPosition(anchorX, anchorY);
            break;
        }
    }
}

Widget.prototype.onWindowResize = function(windowWidth, windowHeight) {
    this.anchorInWindow(windowWidth, windowHeight);
}