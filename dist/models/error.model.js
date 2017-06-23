"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Error {
}
class ErrorModel {
    constructor(message, code) {
        this.error = new Error();
        this.error.message = message;
    }
}
exports.ErrorModel = ErrorModel;
//# sourceMappingURL=error.model.js.map