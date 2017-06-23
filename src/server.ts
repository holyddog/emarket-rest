import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import * as logger from "morgan";
import * as path from "path";
import errorHandler = require("errorhandler");
import methodOverride = require("method-override");
import * as mongodb from 'mongodb';

var passport = require('passport');

import { Config } from './config';
import { OAuth2 } from './oauth2';

import { UserApi } from './api/user.api';

export class Server {
    public app: express.Express

    public static bootstrap(): Server {
        return new Server();
    };

    constructor() {
        this.app = express();

        this.config().then((db: mongodb.Db) => {
            new OAuth2(this.app, db);

            db.collection('users').createIndex('id', { name: 'pk', unique: true });

            this.api(db);
        });
    }

    private authenticate(req, res, next) {
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

    public api(db: mongodb.Db) {
        let app = this.app;

        let user = new UserApi(db);
        
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

    public config() {
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
        let mc = Config.Mongo;
        let url = `mongodb://${mc.User}:${mc.Password}@${mc.Host}/${mc.DBName}?authMechanism=DEFAULT&authSource=${mc.AuthSource}`;

        return mongo.connect(url);
    }
}