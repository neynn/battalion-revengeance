export const GenericButton = function(element, config) {
    this.element = element;
    this.config = config;
    this.element.onclick = () => this.click();
    this.image = document.createElement("img");
    this.text = document.createElement("p");
    this.element.appendChild(this.image);
    this.element.appendChild(this.text);
    this.clickHandlers = [];
}

GenericButton.prototype.click = function() {
    for(let i = 0; i < this.clickHandlers.length; i++) {
        this.clickHandlers[i](this);
    }
}

GenericButton.prototype.addClick = function(onClick) {
    if(typeof onClick === "function") {
        this.clickHandlers.push(onClick);
    }

    return this;
}

GenericButton.prototype.addMainClass = function(classID) {
    this.element.classList.add(classID);

    return this;
}

GenericButton.prototype.addTextClass = function(classID) {
    this.text.classList.add(classID);

    return this;
}

GenericButton.prototype.addImageClass = function(classID) {
    this.image.classList.add(classID);

    return this;
}

GenericButton.prototype.setText = function(text) {
    this.text.innerText = text;

    return this;
}

GenericButton.prototype.setImage = function(source) {
    this.image.src = source;

    return this;
}

GenericButton.prototype.hide = function() {
    this.element.style.display = "block";

    return this;
}

GenericButton.prototype.show = function() {
    this.element.style.display = "none";

    return this;
}