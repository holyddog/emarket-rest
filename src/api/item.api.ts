import * as mongodb from 'mongodb';
import * as crypto from 'crypto';

import * as api from '../base-api';
import { Config } from '../config';
import { ItemModel } from '../models/item.model';
import { ErrorModel } from '../models/error.model';

export class ItemApi {
    private items: mongodb.Collection;
    private db: mongodb.Db;

    constructor(db: mongodb.Db) {
        this.db = db;
        this.items = db.collection('items');
    }

    findAll(req, res) {
        this.items.find({}, { _id: 0 }).sort({ id: 1 }).toArray().then(
            data => res.json(data)
        );
    }

    findById(req, res) {
        let id: mongodb.Long = mongodb.Long.fromString(req.params.id);
        this.items.find({ id: id }, { _id: 0 }).toArray().then(
            data => {
                if (data.length > 0) {
                    res.json(data[0])
                }
                else {
                    res.json(new ErrorModel(
                        "Item not found."
                    ))
                }
            }
        );
    }

    create(req, res) {
        let bd: any = req.body;
        let data: ItemModel = {
            id: null,
            name: bd.name,
            desc: bd.desc,
            price: mongodb.Decimal128.fromString(bd.price.toString()),
            pic: bd.pic,
            pics: bd.pics
        };

        api.getNextSeq(this.db, this.items.collectionName)
            .then(id => {
                data.id = id;
                this.items.insert(data);
                return id;
            })
            .then(id => res.json({ id: parseInt(id) }))
            .catch(err => {
                res.json(err);
            });
    }
}