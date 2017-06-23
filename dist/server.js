"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const mongodb = require("mongodb");
var passport = require('passport');
const config_1 = require("./config");
const oauth2_1 = require("./oauth2");
const user_api_1 = require("./api/user.api");
class Server {
    static bootstrap() {
        return new Server();
    }
    ;
    constructor() {
        this.app = express();
        this.config().then((db) => {
            new oauth2_1.OAuth2(this.app, db);
            db.collection('users').createIndex('id', { name: 'pk', unique: true });
            this.api(db);
        });
    }
    authenticate(req, res, next) {
        passport.authenticate('bearer', { session: false }, function (err, user, info) {
            if (err) {
                res.json({
                    error: err
                });
            }
            else if (user === false) {
                res.json({
                    error: { message: 'Unauthorized.' }
                });
            }
            else {
                req['user'] = user;
                next();
            }
        })(req, res, next);
    }
    api(db) {
        let app = this.app;
        let user = new user_api_1.UserApi(db);
        app.get('/api/me', this.authenticate, (req, res) => {
            user.me(req, res);
        });
        app.get('/api/user', this.authenticate, (req, res) => {
            user.findAll(req, res);
        });
        app.get('/api/user/:id', this.authenticate, (req, res) => {
            user.findById(req, res);
        });
        app.post('/api/signin', (req, res) => {
            user.logIn(req, res);
        });
        app.post('/api/signup', (req, res) => {
            user.register(req, res);
        });
        let server = app.listen(3000, () => {
            console.log(`Listening on: http://localhost:${server.address().port}` + ' at ' + new Date().toString());
        });
    }
    config() {
        let app = this.app;
        app.use(cookieParser('emarket-dev'));
        app.use(bodyParser.json());
        app.use(function (req, res, next) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
            next();
        });
        let mongo = mongodb.MongoClient;
        let mc = config_1.Config.Mongo;
        let url = `mongodb://${mc.User}:${mc.Password}@${mc.Host}/${mc.DBName}?authMechanism=DEFAULT&authSource=${mc.AuthSource}`;
        return mongo.connect(url);
    }
}
exports.Server = Server;
//# sourceMappingURL=server.js.map