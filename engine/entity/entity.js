export const Entity = function(id, DEBUG_NAME = "") {
    this.DEBUG_NAME = DEBUG_NAME;
    this.id = id;
    this.config = null;
    this.components = new Map();
    this.activeComponents = [];
    this.flags = Entity.FLAG.NONE;
}

Entity.FLAG = {
    NONE: 1 << 0,
    DESTROY: 1 << 1
};

Entity.DEBUG = {
    LOG_COMPONENT: 0
};

Entity.prototype.hasFlag = function(flag) {
    return (this.flags & flag) !== 0;
}

Entity.prototype.destroy = function() {
    this.flags |= Entity.FLAG.DESTROY;
}

Entity.prototype.setConfig = function(config) {
    if(config !== undefined) {
        this.config = config;
    }
}

Entity.prototype.getID = function() {
    return this.id;
}

Entity.prototype.update = function(gameContext) {
    if(!this.hasFlag(Entity.FLAG.DESTROY)) {
        for(let i = 0; i < this.activeComponents.length; i++) {
            this.activeComponents[i].update(gameContext, this);
        }
    }
}

Entity.prototype.hasComponent = function(componentID) {
    return this.components.has(componentID);
}

Entity.prototype.getComponent = function(componentID) {
    const component = this.components.get(componentID);

    if(!component) {
        return null;
    }

    return component;
}

Entity.prototype.load = function(components) {
    for(const componentID in components) {
        const data = components[componentID];

        if(data) {
            this.loadComponent(componentID, data);
        }
    }
}

Entity.prototype.save = function() {
    const components = {};

    for(const [componentID, component] of this.components) {
        if(typeof component.save === "function") {
            const data = component.save();

            if(data) {
                components[componentID] = data;
            }
        } else {
            if(Entity.DEBUG.LOG_COMPONENT) {
                console.log(`Save not implemented for component ${componentID}`);
            }
        }
    }

    return components;
}

Entity.prototype.initComponent = function(componentID, config) {
    if(!config) {
        return;
    }

    const component = this.components.get(componentID);

    if(component && typeof component.init === "function") {
        component.init(config);
    } else {
        if(Entity.DEBUG.LOG_COMPONENT) {
            console.log(`Init not implemented for component ${componentID}`);       
        }
    }
}

Entity.prototype.loadComponent = function(componentID, data) {    
    const component = this.components.get(componentID);

    if(component && typeof component.load === "function") {
        component.load(data);
    } else {
        if(Entity.DEBUG.LOG_COMPONENT) {
            console.log(`Load not implemented for component ${componentID}`);   
        }
    }
}

Entity.prototype.addComponent = function(componentID, component) {
    if(this.components.has(componentID)) {
        return;
    }

    this.components.set(componentID, component);

    if(typeof component.update === "function") {
        this.activeComponents.push(component);
    }
}

Entity.prototype.removeComponent = function(componentID) {
    const component = this.components.get(componentID);

    if(!component) {
        return;
    }

    for(let i = 0; i < this.activeComponents.length; i++) {
        const activeComponent = this.activeComponents[i];

        if(activeComponent === component) {
            this.activeComponents[i] = this.activeComponents[this.activeComponents.length - 1];
            this.activeComponents.pop();
            break;
        }
    }

    this.components.delete(componentID);
}