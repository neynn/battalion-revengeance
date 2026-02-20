export const CurrencyType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_CURRENCY";
    this.desc = "MISSING_DESC_CURRENCY";
    this.symbol = "$";
    this.exchangeRate = 1;
}

CurrencyType.prototype.load = function(config, DEBUG_NAME) {
    const {
        name = "MISSING_NAME_CURRENCY",
        desc = "MISSING_DESC_CURRENCY",
        symbol = "$", 
        exchangeRate = 1
    } = config;

    this.name = name;
    this.desc = desc;
    this.symbol = symbol;
    this.exchangeRate = exchangeRate
}