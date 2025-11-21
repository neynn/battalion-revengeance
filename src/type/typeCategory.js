export const TypeCategory = function(DEBUG_NAME, stub) {
    this.DEBUG_NAME = DEBUG_NAME;
    this.stub = stub;
    this.types = {};
}

TypeCategory.prototype.hasType = function(typeID) {
    return this.types[typeID] !== undefined;
}

TypeCategory.prototype.checkEnums = function(enums) {
    const names = Object.values(enums);

    for(let i = 0; i < names.length; i++) {
        const name = names[i];

        if(this.types[name] === undefined) {
            console.warn(`${this.DEBUG_NAME}: Enum value ${name} is wrong!`);
        }
    }
}

TypeCategory.prototype.setTypes = function(types, enums) {
    for(const typeName in types) {
        this.types[typeName] = types[typeName];
    }

    this.checkEnums(enums);
} 

TypeCategory.prototype.loadTypes = function(types, TypeClass, enums) {
    for(const typeName in types) {
        this.types[typeName] = new TypeClass(typeName, types[typeName]);
    }

    this.checkEnums(enums);
}

TypeCategory.prototype.getType = function(typeID) {
    const type = this.types[typeID];

    if(!type) {
        console.error(`Type ${typeID} is not registered in category ${this.DEBUG_NAME}! Using stub!`);
        return this.stub;
    }

    return type;
}