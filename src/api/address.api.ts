import * as mongodb from 'mongodb';

import * as api from '../base-api';
import { ErrorModel } from '../models/error.model';
import { AddressModel } from '../models/address.model';
import { Config } from '../config';

export class AddressApi {
    private addresses: mongodb.Collection;
    private provinces: mongodb.Collection;
    private db: mongodb.Db;

    constructor(db: mongodb.Db) {
        this.db = db;
        this.addresses = db.collection('addresses');
        this.provinces = db.collection('provinces');
    }

    findProvinces(req, res) {
        this.provinces.find({}, { _id: 0 }).sort({ id: 1 }).toArray().then(
            data => res.json(data)
        );
    }

    findAll(req, res) {
        let uid: number = +req['user'].id;
        let filter: any = { _id: 0, id: 1, name: 1, faddr: 1, pcode: 1, tel: 1, def: 1 };
        this.addresses.find({ uid: uid, sid: { $exists: false } }, filter).sort({ id: 1 }).toArray().then(
            data => { 
                res.json(data.map(o => {                                        
                    return {
                        id: o.id,
                        name: o.name,
                        full_address: o.faddr,
                        postal_code: o.pcode,
                        telephone: o.tel,
                        default: o.def
                    };
                })); 
            }
        );
    }

    findById(req, res) {
        let id: mongodb.Long = mongodb.Long.fromString(req.params.id);
        this.addresses.findOne({ id: id }).then(
            data => {
                if (data) {
                    res.json({
                        id: data.id,
                        name: data.name,
                        postal_code: data.pcode,
                        telephone: data.tel,
                        address: data.addr,
                        city: data.city,
                        province: data.pv,
                        default: data.def                      
                    });
                }
                else {
                    res.json(new ErrorModel(
                        "Address not found."
                    ));
                }
            }
        );
    }

    create(req, res) {
        let bd: any = req.body;

        if (!bd.province) {
            res.json(new ErrorModel(
                "Province is required."
            ));
            return;
        }

        let data: AddressModel = {
            id: null,
            name: bd.name,
            uid: mongodb.Long.fromNumber(req['user'].id),
            addr: bd.address,
            faddr: `${bd.address.trim()}, ${bd.city}, ${bd.province.name}`,
            city: bd.city,
            pv: bd.province,
            pcode: bd.postal_code,
            tel: bd.telephone
        };

        api.getNextSeq(this.db, this.addresses.collectionName)
            .then(id => {
                data.id = id;
                this.addresses.insert(data);
                return id;
            })
            .then(id => res.json({ id: parseInt(id) }))
            .catch(err => {
                res.json(err);
            });
    }

    update(req, res) {
        let bd: any = req.body;

        if (!bd.province) {
            res.json(new ErrorModel(
                "Province is required."
            ));
            return;
        }

        let data: AddressModel = {
            name: bd.name,
            addr: bd.address,
            faddr: `${bd.address.trim()}, ${bd.city}, ${bd.province.name}`,
            city: bd.city,
            pv: bd.province,
            pcode: bd.postal_code,
            tel: bd.telephone
        };

        this.addresses.update({ id: mongodb.Long.fromNumber(req.params.id) }, { $set: data })
            .then(() => res.json({ success: true }))
            .catch(err => {
                res.json(err);
            });
    }
}