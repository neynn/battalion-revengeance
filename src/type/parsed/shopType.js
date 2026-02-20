import { ENTITY_TYPE } from "../../enums.js";

export const ShopType = function(id) {
    this.id = id;
    this.entities = [];
}

ShopType.prototype.load = function(config, DEBUG_NAME) {
    const { 
        entities = []
    } = config; 

    for(const entityID of entities) {
        const index = ENTITY_TYPE[entityID];

        if(index !== undefined) {
            this.entities.push(index);
        } else {
            console.warn(`${DEBUG_NAME}: EntityType ${entityID} does not exist!`);
        }
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