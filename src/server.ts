import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import * as logger from "morgan";
import * as path from "path";
import errorHandler = require("errorhandler");
import methodOverride = require("method-override");
import * as mongodb from 'mongodb';

var passport = require('passport');
var cors = require('cors');

import { Config } from './config';
import { OAuth2 } from './oauth2';

import { UserApi } from './api/user.api';
import { ItemApi } from './api/item.api';
import { CategoryApi } from './api/category.api';
import { AddressApi } from './api/address.api';
import { OrderApi } from './api/order.api';
import { OrderInterfaceApi } from './api/order-interface.api';

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

            db.collection('items').createIndex('id', { name: 'pk', unique: true });

            db.collection('orders').createIndex('id', { name: 'pk', unique: true });
            db.collection('orders').createIndex('no', { name: 'pk_1', unique: true });

            db.collection('categories').createIndex('id', { name: 'pk', unique: true });
            db.collection('categories').createIndex('no', { name: 'ref_pk' });

            db.collection('packs').createIndex('id', { name: 'pk', unique: true });
            db.collection('packs').createIndex('ono', { name: 'order_fk' });
            db.collection('packs').createIndex('bcode', { name: 'barcode', unique: true });

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
        let item = new ItemApi(db);
        let category = new CategoryApi(db);
        let address = new AddressApi(db);
        let order = new OrderApi(db);
        let orderIntf = new OrderInterfaceApi(db);

        app.get('/version', (req, res) => {
            let v = Config.Version;
            res.json({ version: `${v.base}.${v.major}.${v.minor}` });
        });

        app.get('/me', this.authenticate, (req, res) => {
            user.me(req, res);
        });
        app.get('/users', this.authenticate, (req, res) => {
            user.findAll(req, res);
        });
        app.get('/users/:id', this.authenticate, (req, res) => {
            user.findById(req, res);
        });

        app.post('/signin', (req, res) => {
            user.logIn(req, res);
        });
        app.post('/signup', (req, res) => {
            user.register(req, res);
        });

        app.get('/orders', this.authenticate, (req, res) => {
            order.findByUser(req, res);
        });
        app.get('/orders/:id', this.authenticate, (req, res) => {
            order.findById(req, res);
        });
        app.post('/orders', this.authenticate, (req, res) => {
            order.create(req, res);
        });

        app.post('/ext/orders', (req, res) => {
            orderIntf.create(req, res);
        });
        app.post('/ext/packs', (req, res) => {
            orderIntf.doPack(req, res);
        });
        app.get('/ext/packs/:barcode', (req, res) => {
            orderIntf.getPack(req, res);
        });

        app.post('/items', this.authenticate, (req, res) => {
            item.create(req, res);
        });
        app.get('/items', (req, res) => {
            item.findAll(req, res);
        });
        app.get('/items/:id', (req, res) => {
            item.findById(req, res);
        });
        
        app.get('/categories', (req, res) => {
            category.findMainCategories(req, res);
        });
        
        app.get('/addresses', this.authenticate, (req, res) => {
            address.findAll(req, res);
        });

        let server = app.listen(Config.Port, () => {
            console.log(`Listening on: ${Config.Host}:${Config.Port}` + ' at ' + new Date().toString());
        });
    }

    public config() {
        let app = this.app;

        app.use(cookieParser('emarket-dev'));
        app.use(bodyParser.json());        
        app.use(cors());
        app.use(Config.FileDir, express.static('public'));

        app.use(function (req, res, next) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT,PATCH,DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
            
            next();
        });

        let mongo = mongodb.MongoClient;
        let mc = Config.Mongo;
        let url = `mongodb://${mc.User}:${mc.Password}@${mc.Host}/${mc.DBName}?authMechanism=DEFAULT&authSource=${mc.AuthSource}`;

        return mongo.connect(url);
    }
}