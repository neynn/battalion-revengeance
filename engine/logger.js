import { saveTemplateAsFile } from "../helpers.js";

export const Logger = function() {
    this.engineLogs = 0;
    this.gameLogs = 0;
    this.logs = [];
}

Logger.INSTANCE = new Logger();

Logger.EXPORT_CODE_ALL = -1;

Logger.SHOW_LOGS = true;

Logger.CODE = {
    INFO: 0,
    WARN: 1,
    ERROR: 2,
    ENGINE_INFO: 3,
    ENGINE_WARN: 4,
    ENGINE_ERROR: 5
};

Logger.prototype.clear = function() {
    this.engineLogs = 0;
    this.gameLogs = 0;
    this.logs.length = 0;
}

Logger.prototype.exportLogs = function(exportCode) {
    if(exportCode === Logger.EXPORT_CODE_ALL) {
        return JSON.stringify(this.logs, null, 4);
    }

    const filteredLogs = [];

    for(let i = 0; i < this.logs.length; i++) {
        const log = this.logs[i];
        const { code } = log;

        if(code === exportCode) {
            filteredLogs.push(log);
        }
    }

    return JSON.stringify(filteredLogs, null, 4);
}

Logger.prototype.log = function(code, reason, script, attachments) {
    const logEntry = {
        "code": code,
        "timestamp": new Date().toISOString(),
        "reason": reason,
        "script": script,
        "attachments": attachments
    };

    switch(code) {
        case Logger.CODE.INFO: {
            this.gameLogs++;
            break;
        }
        case Logger.CODE.WARN: {
            this.gameLogs++;
            this.logs.push(logEntry);
            break;
        }
        case Logger.CODE.ERROR: {
            this.gameLogs++;
            this.logs.push(logEntry);
            break;
        }
        case Logger.CODE.ENGINE_INFO: {
            this.engineLogs++;
            break;
        }
        case Logger.CODE.ENGINE_WARN: {
            this.engineLogs++;
            break;
        }
        case Logger.CODE.ENGINE_ERROR: {
            this.engineLogs++;
            this.logs.push(logEntry);
            break;
        }
    }
   
    if(Logger.SHOW_LOGS) {
        switch(code) {
            case Logger.CODE.INFO: {
                console.log(logEntry)
                break;
            }
            case Logger.CODE.ENGINE_INFO: {
                console.info(logEntry);
                break;
            }
            case Logger.CODE.WARN:
            case Logger.CODE.ENGINE_WARN: {
                console.warn(logEntry);
                break;
            }
            case Logger.CODE.ERROR:
            case Logger.CODE.ENGINE_ERROR: {
                console.error(logEntry);
                break;
            }
        }
    }
}

Logger.exportLogs = function(exportCode) {
    const logs = Logger.INSTANCE.exportLogs(exportCode);

    saveTemplateAsFile("logger.json", logs);
}

Logger.log = function(code, reason, script, attachments) {
    Logger.INSTANCE.log(code, reason, script, attachments);
}