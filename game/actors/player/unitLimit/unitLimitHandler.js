import { LimitGroup } from "./limitGroup.js";

export const UnitLimitHandler = function() {
    this.groups = new Map();
    this.current = null;
}

UnitLimitHandler.prototype.removeByCost = function(costObject) {
    if(this.current) {
        this.current.removeByCost(costObject);
    }
}

UnitLimitHandler.prototype.addByCost = function(costObject) {
    if(this.current) {
        this.current.addByCost(costObject);
    }
}

UnitLimitHandler.prototype.clear = function() {
    this.groups.clear();
    this.current = null;
}

UnitLimitHandler.prototype.deselectGroup = function() {
    this.current = null;
}

UnitLimitHandler.prototype.selectGroup = function(groupID) {
    const group = this.groups.get(groupID);

    if(group) {
        this.current = group;
    } else {
        this.current = null;
    }
}

UnitLimitHandler.prototype.createGroup = function(groupID) {
    if(!this.groups.has(groupID)) {
        this.groups.set(groupID, new LimitGroup());
    }
}