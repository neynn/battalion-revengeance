export const LimitGroup = function() {
    this.infantryCount = 0;
    this.infantryLimit = 0;
    this.armorCount = 0;
    this.armorLimit = 0;
    this.artilleryCount = 0;
    this.artilleryLimit = 0;
}

LimitGroup.prototype.removeByCost = function(cost) {
    this.infantryCount -= cost.infantry ?? 0;
    this.armorCount -= cost.armor ?? 0;
    this.artilleryCount -= cost.artillery ?? 0;
}

LimitGroup.prototype.addByCost = function(cost) {
    this.infantryCount += cost.infantry ?? 0;
    this.armorCount += cost.armor ?? 0;
    this.artilleryCount += cost.artillery ?? 0;
}