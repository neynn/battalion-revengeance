export const ShopType = function(id, config) {
    const { 
        entities = []
    } = config;

    this.id = id;
    this.entities = entities;
}

ShopType.prototype.hasEntity = function(entityID) {
    for(let i = 0; i < this.entities.length; i++) {
        if(this.entities[i] === entityID) {
            return true;
        }
    }

    return false;
}