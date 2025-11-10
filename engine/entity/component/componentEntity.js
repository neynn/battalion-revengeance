import { Entity } from "../entity.js";

export const ComponentEntity = function(id, DEBUG_NAME) {
    Entity.call(this, id, DEBUG_NAME);

    this.components = new Map();
    this.activeComponents = [];
}

ComponentEntity.DEBUG = {
    LOG_COMPONENT: 0
};

ComponentEntity.prototype = Object.create(Entity.prototype);
ComponentEntity.prototype.constructor = ComponentEntity;

ComponentEntity.prototype.update = function(gameContext) {
    for(let i = 0; i < this.activeComponents.length; i++) {
        this.activeComponents[i].update(gameContext, this);
    }
}

ComponentEntity.prototype.hasComponent = function(componentID) {
    return this.components.has(componentID);
}

ComponentEntity.prototype.getComponent = function(componentID) {
    const component = this.components.get(componentID);

    if(!component) {
        return null;
    }

    return component;
}

ComponentEntity.prototype.load = function(components) {
    for(const componentID in components) {
        const data = components[componentID];

        if(data) {
            this.loadComponent(componentID, data);
        }
    }
}

ComponentEntity.prototype.save = function() {
    const components = {};

    for(const [componentID, component] of this.components) {
        if(typeof component.save === "function") {
            const data = component.save();

            if(data) {
                components[componentID] = data;
            }
        } else {
            if(ComponentEntity.DEBUG.LOG_COMPONENT) {
                console.log(`Save not implemented for component ${componentID}`);
            }
        }
    }

    return components;
}

ComponentEntity.prototype.initComponent = function(componentID, config) {
    if(!config) {
        return;
    }

    const component = this.components.get(componentID);

    if(component && typeof component.init === "function") {
        component.init(config);
    } else {
        if(ComponentEntity.DEBUG.LOG_COMPONENT) {
            console.log(`Init not implemented for component ${componentID}`);       
        }
    }
}

ComponentEntity.prototype.loadComponent = function(componentID, data) {    
    const component = this.components.get(componentID);

    if(component && typeof component.load === "function") {
        component.load(data);
    } else {
        if(ComponentEntity.DEBUG.LOG_COMPONENT) {
            console.log(`Load not implemented for component ${componentID}`);   
        }
    }
}

ComponentEntity.prototype.addComponent = function(componentID, component) {
    if(this.components.has(componentID)) {
        return;
    }

    this.components.set(componentID, component);

    if(typeof component.update === "function") {
        this.activeComponents.push(component);
    }
}

ComponentEntity.prototype.removeComponent = function(componentID) {
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