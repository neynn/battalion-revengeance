export const GenericButton = function(element, width, height) {
    this.width = width;
    this.height = height;
    this.element = element;
    this.element.onclick = () => this.click();
    this.image = document.createElement("img");
    this.text = document.createElement("p");
    this.element.appendChild(this.image);
    this.element.appendChild(this.text);
    this.clickHandlers = [];
    this.state = GenericButton.STATE.ENABLED;
}

GenericButton.STATE = {
    DISABLED: 0,
    ENABLED: 1
};

GenericButton.prototype.disable = function() {
    this.state = GenericButton.STATE.DISABLED;
    this.image.src = "assets/gui/generic_button_disabled.png";
}

GenericButton.prototype.enable = function() {
    this.state = GenericButton.STATE.ENABLED;
    this.image.src = "assets/gui/generic_button.png";
}

GenericButton.prototype.click = function() {
    if(this.state === GenericButton.STATE.DISABLED) {
        return;
    }
    
    for(let i = 0; i < this.clickHandlers.length; i++) {
        this.clickHandlers[i](this);
    }
}

GenericButton.prototype.addClick = function(onClick) {
    if(typeof onClick === "function") {
        this.clickHandlers.push(onClick);
    }
}

GenericButton.prototype.addMainClass = function(classID) {
    this.element.classList.add(classID);
}

GenericButton.prototype.addTextClass = function(classID) {
    this.text.classList.add(classID);
}

GenericButton.prototype.addImageClass = function(classID) {
    this.image.classList.add(classID);
}

GenericButton.prototype.setText = function(text) {
    this.text.innerText = text;
}

GenericButton.prototype.setImage = function(source) {
    this.image.src = source;
}

GenericButton.prototype.hide = function() {
    this.element.style.display = "none";
}

GenericButton.prototype.show = function() {
    this.element.style.display = "block";
}

GenericButton.prototype.load = function() {
    this.image.src = "assets/gui/generic_button.png";

    this.element.onmouseover = () => {
        if(this.state === GenericButton.STATE.ENABLED) {
            this.image.src = "assets/gui/generic_button_hovered.png";
        }
    }

    this.element.onmouseout = () => {
        if(this.state === GenericButton.STATE.ENABLED) {
            this.image.src = "assets/gui/generic_button.png"; 
        }
    }

    this.element.onmousedown = () => {
        if(this.state === GenericButton.STATE.ENABLED) {
            this.image.src = "assets/gui/generic_button_pressed.png";
        }
    }
}