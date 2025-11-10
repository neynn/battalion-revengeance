export const ComponentManager = function() {
    this.traits = {};
    this.archetypes = {};
    this.components = new Map();
}

ComponentManager.prototype.load = function(traits, archetypes) {
    this.traits = traits;
    this.archetypes = archetypes;
}

ComponentManager.prototype.createComponentInstance = function(componentID) {
    const Component = this.components.get(componentID);

    if(!Component) {
        return null;
    }

    return new Component();
}

ComponentManager.prototype.initComponentMap = function(entity, components) {
    for(const componentID in components) {
        if(!entity.hasComponent(componentID)) {
            const instance = this.createComponentInstance(componentID);

            if(instance) {
                entity.addComponent(componentID, instance);
            }
        }

        entity.initComponent(componentID, components[componentID]);
    }
}

ComponentManager.prototype.addArchetypeComponents = function(entity, archetypeID) {
    const archetype = this.archetypes[archetypeID];

    if(!archetype || !archetype.components) {
        return;
    }

    this.initComponentMap(entity, archetype.components);
}

ComponentManager.prototype.addTraitComponents = function(entity, traits) {
    for(let i = 0; i < traits.length; i++) {
        const traitID = traits[i];
        const trait = this.traits[traitID];

        if(!trait || !trait.components) {
            continue;
        }

        this.initComponentMap(entity, trait.components);
    }
}

ComponentManager.prototype.registerComponent = function(componentID, componentClass) {
    if(this.components.has(componentID)) {
        return;
    }

    this.components.set(componentID, componentClass);
}