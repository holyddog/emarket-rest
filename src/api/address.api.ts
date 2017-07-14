import * as mongodb from 'mongodb';

import * as api from '../base-api';
import { Config } from '../config';

export class AddressApi {
    private addresses: mongodb.Collection;
    private db: mongodb.Db;

    constructor(db: mongodb.Db) {
        this.db = db;
        this.addresses = db.collection('addresses');
    }

    findAll(req, res) {
        let uid: number = +req['user'].id;
        this.addresses.find({ uid: uid }, { _id: 0 }).sort({ id: 1 }).toArray().then(
            data => res.json(data)
        );
    }
}