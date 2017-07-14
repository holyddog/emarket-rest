import * as mongodb from 'mongodb';

import * as api from '../base-api';
import { Config } from '../config';

import { ErrorModel } from '../models/error.model';
import { OrderModel, OrderItem } from '../models/order.model';
import { AddressModel } from '../models/address.model';

export class OrderApi {
    private orders: mongodb.Collection;
    private db: mongodb.Db;

    constructor(db: mongodb.Db) {
        this.db = db;
        this.orders = db.collection('orders');
    }

    findByUser(req, res) {
        let uid: number = +req['user'].id;
        this.orders.find({ cby: uid }, { _id: 0 }).toArray().then(
            data => {
                res.json(data);
            }
        );
    }

    findById(req, res) {
        let id: mongodb.Long = mongodb.Long.fromString(req.params.id);
        this.orders.find({ id: id }, { _id: 0 }).toArray().then(
            data => {
                if (data.length > 0) {
                    res.json(data[0]);
                }
                else {
                    res.json(new ErrorModel(
                        "Order not found."
                    ));
                }
            }
        );
    }

    create(req, res) {
        let bd = req.body;
        let now = new Date();
        let items: any[] = bd.items;
        let uid: number = +req['user'].id;

        if (!items || (items && items.length == 0)) {
            res.json(new ErrorModel(
                "Order product not found."
            ));
            return;
        }

        if (!bd.recp) {
            res.json(new ErrorModel(
                "Recipient address is required."
            ));
            return;
        }

        if (!bd.popt) {
            res.json(new ErrorModel(
                "Payment method is required."
            ));
            return;
        }

        let netPrice: number = 0;
        let shipPrice: number = 0;
        let prodPrice: number = 0;
        let totalQty: number = 0;

        for (let i of items) {
            i.price = (i.item.price * i.qty);

            prodPrice += i.price;
            shipPrice += i.sprice;
            netPrice += (i.price + i.sprice);
            totalQty += i.qty;
        }

        let data: OrderModel = {
            price: mongodb.Decimal128.fromString(prodPrice.toString()),
            sprice: mongodb.Decimal128.fromString(shipPrice.toString()),
            nprice: mongodb.Decimal128.fromString(netPrice.toString()),
            payment: false,
            popt: bd.popt,
            recp: bd.recp,
            items: items
        };

        let yy = now.getFullYear().toString().slice(-2);
        let mm = ("00" + (now.getMonth() + 1)).slice(-2);
        let dd = ("00" + now.getDate()).slice(-2);
        let ref = yy + mm + dd;
        
        api.runningNo(this.db, 'orders_no', ref)
            .then(seq => {
                let run = ("00000" + seq).slice(-6);
                data.no = ref + run;
                return api.getNextSeq(this.db, this.orders.collectionName);
            })
            .then(id => {
                data.id = id;

                data.cby = mongodb.Long.fromNumber(uid);
                data.cdate = mongodb.Long.fromNumber(now.getTime());
                data.eby = mongodb.Long.fromNumber(uid);
                data.edate = mongodb.Long.fromNumber(now.getTime());

                this.orders.insert(data);
                return id;
            })
            .then(id => res.json({ id: data.id }));
    }
}