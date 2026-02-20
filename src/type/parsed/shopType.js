export const ShopType = function(id) {
    this.id = id;
    this.entities = [];
}

ShopType.prototype.load = function(config, DEBUG_NAME) {
    const { 
        entities = []
    } = config; 

    for(const entityID of entities) {
        this.entities.push(entityID);
    }
}

ShopType.prototype.hasEntity = function(entityID) {
    for(let i = 0; i < this.entities.length; i++) {
        if(this.entities[i] === entityID) {
            return true;
        }
    }

    return false;
}