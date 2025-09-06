export const Member = function(id, name) {
    this.id = id;
    this.name = name;
}

Member.prototype.getName = function() {
    return this.name;
}