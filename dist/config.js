"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = {
    Mongo: {
        Host: '127.0.0.1:27017',
        User: encodeURIComponent('admin'),
        Password: encodeURIComponent('whitedog'),
        DBName: 'emarket-dev',
        AuthSource: 'admin'
    },
    FileDir: '/files'
};
//# sourceMappingURL=config.js.map