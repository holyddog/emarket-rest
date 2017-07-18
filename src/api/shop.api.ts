import * as mongodb from 'mongodb';
import * as crypto from 'crypto';

import * as api from '../base-api';
import { Config } from '../config';
import { ShopModel } from '../models/shop.model';
import { AddressModel } from '../models/address.model';
import { ErrorModel } from '../models/error.model';

export class ShopApi {
    private shops: mongodb.Collection;
    private addresses: mongodb.Collection;
    private db: mongodb.Db;

    constructor(db: mongodb.Db) {
        this.db = db;
        this.shops = db.collection('shops');
        this.addresses = db.collection('addresses');
    }

    create(req, res) {
        let bd: any = req.body;

        let addr: AddressModel = {
            id: null,
            name: bd.name,
            uid: mongodb.Long.fromNumber(req['user'].id),
            sid: null,
            addr: bd.address,
            faddr: `${bd.address.trim()}, ${bd.city}, ${bd.province.name}`,
            city: bd.city,
            pv: bd.province,
            pcode: bd.postal_code,
            tel: bd.telephone
        };

        let data: ShopModel = {
            id: null,
            name: bd.name,
            url: bd.url,
            desc: bd.description,
            uid: mongodb.Long.fromNumber(req['user'].id)
        };

        api.getNextSeq(this.db, this.shops.collectionName)
            .then(id => {
                data.id = id;
                this.shops.insert(data);
                return api.getNextSeq(this.db, this.addresses.collectionName);
            })
            .then(id => {                
                addr.id = id;
                addr.sid = mongodb.Long.fromNumber(data.id);
                return this.addresses.insert(addr);
            })
            .then(() => {
                res.json({
                    id: +data.id,
                    name: data.name,
                    url: data.url
                });
            })
            .catch(err => {
                res.json(err);
            });
    }
}