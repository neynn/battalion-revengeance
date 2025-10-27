export const TypeCategory = function(id, values, stub) {
    this.id = id;
    this.values = values;
    this.stub = stub;
    this.types = {};

    for(const valueName in values) {
        if(valueName !== values[valueName]) {
            console.log(`Wrong enum! ${valueName} does not match ${values[valueName]} in ${id}!`);
        }
    }
}

TypeCategory.prototype.hasType = function(typeID) {
    return this.types[typeID] !== undefined;
}

TypeCategory.prototype.logMissingEnum = function(typeID) {
    console.log(`Enum for ${typeID} is not registered in category ${this.id}!`);
}

TypeCategory.prototype.setTypes = function(types) {
    for(const typeName in types) {
        const typeID = this.values[typeName];

        if(typeID === undefined) {
            this.logMissingEnum(typeName);
        }

        this.types[typeName] = types[typeName];
    }
} 

TypeCategory.prototype.loadTypes = function(types, TypeClass) {
    for(const typeName in types) {
        const typeID = this.values[typeName];

        if(typeID === undefined) {
            this.logMissingEnum(typeName);
        }

        this.types[typeName] = new TypeClass(typeName, types[typeName]);
    }
}

TypeCategory.prototype.getType = function(typeID) {
    const type = this.types[typeID];

    if(!type) {
        console.error(`Type ${typeID} is not registered in category ${this.id}! Using stub!`);
        return this.stub;
    }

    return type;
}