export const AssetBrowser = function(browserID, pageSize = 10, fallbackItem) {
    this.browserID = browserID;
    this.pageSize = pageSize;
    this.pageIndex = 0;
    this.fallbackItem = fallbackItem;
    this.items = [];
}

AssetBrowser.prototype.getPageString = function() {
    return `${this.pageIndex + 1} / ${this.getMaxPagesNeeded()}`;
}

AssetBrowser.prototype.getMaxPagesNeeded = function() {
    if(this.pageSize === 0) {
        return 1;
    }

    const maxPagesNeeded = Math.ceil(this.items.length / this.pageSize);

    if(maxPagesNeeded <= 0) {
        return 1;
    }

    return maxPagesNeeded;
}

AssetBrowser.prototype.addItem = function(item) {
    this.items.push(item);
}

AssetBrowser.prototype.getSize = function() {
    return this.items.length;
}

AssetBrowser.prototype.addItemSpan = function(begin, end) {
    for(let i = begin; i <= end; i++) {
        this.items.push(i);
    }
}

AssetBrowser.prototype.getItemIndex = function(index) {
    if(index < 0 || index >= this.pageSize) {
        return -1;
    }

    return this.pageIndex * this.pageSize + index;
}

AssetBrowser.prototype.getItem = function(index) {
    const itemIndex = this.getItemIndex(index);

    if(itemIndex < 0 || itemIndex >= this.items.length) {
        return this.fallbackItem;
    }

    return this.items[itemIndex];
}

AssetBrowser.prototype.forward = function() {
    const maxPagesNeeded = this.getMaxPagesNeeded();

    if(++this.pageIndex >= maxPagesNeeded) {
        this.pageIndex = 0;
    }
}

AssetBrowser.prototype.backward = function() {
    if(--this.pageIndex < 0) {
        const maxPagesNeeded = this.getMaxPagesNeeded();

        this.pageIndex = maxPagesNeeded - 1;
    }
}

AssetBrowser.prototype.setPage = function(index) {
    const maxPagesNeeded = this.getMaxPagesNeeded();

    if(index < 0) {
        this.pageIndex = 0;
    } else if(index >= maxPagesNeeded) {
        this.pageIndex = maxPagesNeeded - 1;
    } else {
        this.pageIndex = index;
    }
}

AssetBrowser.prototype.scroll = function(delta) {
    this.setPage(this.pageIndex + delta);
}