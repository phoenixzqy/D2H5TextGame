import { getLoggerElement } from "../view/panel/log";
class Logger {
    constructor() {
        this.logElement = getLoggerElement();
    }
    log(msg) {
        if (this.logElement) {
            this.logElement.addLog(msg);
        }
    }
}
export default new Logger();
//# sourceMappingURL=logger.js.map