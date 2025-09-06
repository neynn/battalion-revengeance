export const ArmorComponent = function() {
    this.armor = 0;
}

ArmorComponent.prototype.init = function(config) {
    const { armor } = config;

    if(armor) {
        this.armor = armor;
    }
}