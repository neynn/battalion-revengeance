import { clampValue } from "../../../../engine/math/math.js";

export const Item = function(maxDrop = 1, maxCount = 0) {
    this.maxDrop = maxDrop;
    this.maxCount = maxCount;
    this.count = 0;
}

Item.prototype.has = function(value) {
    return this.count >= value;
}

Item.prototype.add = function(value) {
    this.count = clampValue(this.count + value, this.maxCount, 0);
}

Item.prototype.remove = function(value) {
    this.count = clampValue(this.count - value, this.maxCount, 0);
}

Item.prototype.setCount = function(count) {
    this.count = clampValue(count, this.maxCount, 0);
}

Item.prototype.getCount = function() {
    return this.count;
}