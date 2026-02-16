export const LayeredEntityLocator = function() {
    this.entities = new Map();
}

LayeredEntityLocator.prototype.getTopEntity = function(index) {
    const list = this.entities.get(index);

    if(!list || list.length === 0) {
        return null;
    }

    return list[list.length - 1];
}

LayeredEntityLocator.prototype.getBottomEntity = function(index) {
    const list = this.entities.get(index);

    if(!list || list.length === 0) {
        return null;
    }

    return list[0];
}

LayeredEntityLocator.prototype.isOccupied = function(index) {
    const list = this.entities.get(index);

    if(!list) {
        return false;
    }

    return list.length > 0;
}

LayeredEntityLocator.prototype.hasEntity = function(index, entityID) {
    const list = this.entities.get(index);

    if(list) {
        for(let i = 0; i < list.length; i++) {
            if(list[i] === entityID) {
                return true;
            }
        }
    }

    return false;
} 

LayeredEntityLocator.prototype.removeEntity = function(index, entityID) {
    const list = this.entities.get(index);

    if(!list) {
        return;
    }

    for(let i = 0; i < list.length; i++) {
        if(list[i] === entityID) {
            list.splice(i, 1);
            break;
        }
    }

    if(list.length === 0) {
        this.entities.delete(index);
    }
}

LayeredEntityLocator.prototype.addEntity = function(index, entityID) {
    const list = this.entities.get(index);

    if(!list) {
        this.entities.set(index, [entityID]);
    } else {
        list.push(entityID);
    }
}