export const Widget = function() {
    this.anchor = Widget.ANCHOR_TYPE.TOP_LEFT;
    this.positionX = 0;
    this.positionY = 0;
    this.width = 0;
    this.height = 0;
}

Widget.ANCHOR_TYPE = {
    TOP_CENTER: 0,
    TOP_LEFT: 1,
    TOP_RIGHT: 2,
    BOTTOM_CENTER: 3,
    BOTTOM_LEFT: 4,
    BOTTOM_RIGHT: 5,
    CENTER: 6,
    LEFT: 7,
    RIGHT: 8,
    _COUNT: 9,
};