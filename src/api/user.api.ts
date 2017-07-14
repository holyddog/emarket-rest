import * as mongodb from 'mongodb';
import * as crypto from 'crypto';
import * as request from 'request-promise';

import * as api from '../base-api';
import { Config } from '../config';
import { ErrorModel } from '../models/error.model';

export class UserApi {
    private users: mongodb.Collection;
    private db: mongodb.Db;

    constructor(db: mongodb.Db) {
        this.db = db;
        this.users = db.collection('users');
    }

    me(req, res) {
        let fields = { _id: 0, id: 1, email: 1, fname: 1, lname: 1 };
        return this.users.find({ id: req.user.id }, fields).toArray().then(
            data => {
                res.json(data[0])
            }
        );
    }

    logIn(req, res) {        
        let filter = {
            email: req.body.email,
            pwd: crypto.createHash('md5').update(req.body.pwd).digest("hex")
        };
        let fields = { _id: 0, id: 1, email: 1, fname: 1, lname: 1 };
        this.users.find(filter, fields).toArray().then(
            data => {
                if (data.length > 0) {
                    let user = data[0];

                    request.post({
                        url: `${Config.Host}:${Config.Port}/api/oauth/token`,
                        json: true,
                        body: {
                            "grant_type": "password",
                            "username": req.body.email,
                            "password": req.body.pwd,
                            "client_id": req.body.client_id,
                            "client_secret": req.body.client_secret
                        }
                    }).then((httpResponse) => {
                        user.token = httpResponse.access_token;
                        res.json(user);
                    }).catch((err) => {
                        if (err.statusCode == 401) {
                            res.json(new ErrorModel(
                                "Authentication failed."
                            ));
                        }
                        else {
                            res.json(new ErrorModel(
                                `(${err.statusCode}) Unknown error.`
                            ));
                        } 
                    });
                }
                else {
                    res.json(new ErrorModel(
                        "Invalid email or password."
                    ))
                }
            }
        );
    }

    register(req, res) {
        let data: any = {
            pwd: crypto.createHash('md5').update(req.body.pwd).digest("hex"),
            email: req.body.email,
            fname: req.body.fname,
            lname: req.body.lname
        };

        api.checkDuplicate(this.users, 'email', req.body.email)
            .then(dup => {
                if (dup) {
                    throw new ErrorModel(
                        "This email is already used."
                    );
                }
                else {
                    return api.getNextSeq(this.db, this.users.collectionName);
                }
            })
            .then(id => {
                data.id = id;
                return this.users.insert(data);
            })
            .then(() =>
                res.json({ success: true }
                ))
            .catch(err => {
                res.json(err);
            });
    }

    findAll(req, res) {
        this.users.find({}, { _id: 0 }).sort({ id: 1 }).toArray().then(
            data => res.json(data)
        );
    }

    findById(req, res) {
        let id: mongodb.Long = mongodb.Long.fromString(req.params.id);
        this.users.find({ id: id }, { _id: 0 }).toArray().then(
            data => {
                if (data.length > 0) {
                    res.json(data[0])
                }
                else {
                    res.json(new ErrorModel(
                        "User not found."
                    ))
                }
            }
        );
    }

    create(req, res) {
        let data: any = {

        };
        api.getNextSeq(this.db, this.users.collectionName)
            .then(id => {
                data.id = id;
                this.users.insert(data);
                return id;
            })
            .then(id => res.json({ success: 1, id: id }));
    }
}