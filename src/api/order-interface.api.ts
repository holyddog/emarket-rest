import * as mongodb from 'mongodb';
import * as request from 'request-promise';

import * as api from '../base-api';
import { Config } from '../config';
import { ErrorModel } from '../models/error.model';
import { PreloadResult } from '../models/preload-result.model';
import { OrderModel, OrderItem } from '../models/order.model';
import { PackModel } from '../models/pack.model';
import { AddressModel } from '../models/address.model';
import { ServiceTypeModel } from '../models/service-type.model';

export class OrderInterfaceApi {
    private orders: mongodb.Collection;
    private packs: mongodb.Collection;
    private serviceTypes: mongodb.Collection;
    private db: mongodb.Db;

    constructor(db: mongodb.Db) {
        this.db = db;
        this.orders = db.collection('orders');
        this.packs = db.collection('packs');
        this.serviceTypes = db.collection('service_types');
    }

    getPack(req, res) {
        this.packs.findOne({ bcode: req.params.barcode })
            .then(p => {
                if (!p) {
                    throw new ErrorModel(
                        "Data not found."
                    );
                }
                else {
                    let recp = p.recp;
                    let sender = p.sender;

                    res.json({
                        "barcode": p.bcode,
                        "price": parseFloat(p.price.toString()),
                        "weight": parseFloat(p.weight.toString()),
                        "service": p.sv,
                        "recipient": {
                            "first_name": recp.fname,
                            "last_name": recp.lname,
                            "postal_code": recp.pcode,
                            "phone": recp.tel,
                            "address": recp.addr
                        },
                        "sender": {
                            "first_name": sender.fname,
                            "last_name": sender.lname,
                            "postal_code": sender.pcode,
                            "phone": sender.tel,
                            "address": sender.addr
                        }
                    });
                }
            })
            .catch(err => {
                res.json(err);
            });
    }

    doPack(req, res) {
        let bd = req.body;
        let items: OrderItem[] = [];

        if (bd.items) {
            for (let i of bd.items) {
                items.push({
                    qty: i.qty,
                    item: {
                        id: i.id,
                        name: i.name
                    }
                })
            }
        }

        if (items.length == 0) {
            res.json(new ErrorModel(
                "Order item at least 1 required."
            ));
            return;
        }

        if (!bd.weight) {
            res.json(new ErrorModel(
                "Weight is required."
            ));
            return;
        }

        let data: PackModel = {
            ono: bd.order_no,
            weight: mongodb.Decimal128.fromString(bd.weight.toFixed(2)),
            items: bd.items
        };
        let returnPrice = 0;

        this.serviceTypes.findOne({ type: bd.service_type })
            .then(sv => {
                if (!sv) {
                    throw new ErrorModel(
                        "Invalid service type."
                    );
                }
                else {
                    data.sv = {
                        name: sv.name,
                        type: sv.type
                    };
                    return this.orders.findOne({ no: bd.order_no });
                }
            })
            .then(order => {
                if (!order) {
                    throw new ErrorModel(
                        "Order not found."
                    );
                }
                else {
                    data.recp = order.recp;
                    data.sender = order.sender;

                    return request.get({
                        url: `${Config.PreloadUrl}/customer/v1/psprice/${data.sv.type}/${bd.weight}`,
                        headers: {
                            auth_key: Config.PreloadKey
                        },
                        json: true
                    });
                }
            })
            .then((httpResponse: PreloadResult) => {
                if (httpResponse.IsSuccess) {
                    let price: mongodb.Decimal128 = mongodb.Decimal128.fromString(httpResponse.Data.PriceShow.substring(1));
                    data.price = price;
                    returnPrice = parseFloat(httpResponse.Data.PriceShow.substring(1));

                    return request.get({
                        url: `${Config.PreloadUrl}/customer/v1/set_barcode?sv_type=${data.sv.type}&qty=1`,
                        headers: {
                            auth_key: Config.PreloadKey
                        },
                        json: true
                    });
                }
                else {
                    res.json(new ErrorModel(
                        httpResponse.ErrorMesg
                    ));
                    return;
                }
            })
            .then((httpResponse: PreloadResult) => {
                if (httpResponse.IsSuccess) {
                    let barcode: string = httpResponse.Data.first_barcode;
                    data.bcode = barcode;

                    let mailingItems = [];
                    mailingItems.push({
                        "barcode": data.bcode,
                        "sv_type": data.sv.type,
                        "weight": bd.weight,
                        "col_amount": 0.0,
                        "warranty": 0.0,
                        "recipient": {
                            "firstname": data.recp.fname,
                            "lastname": data.recp.lname,
                            "fullname": data.recp.fname + " " + data.recp.lname,
                            "postal_code": data.recp.pcode,
                            "phone": data.recp.tel,
                            "full_addr": data.recp.addr
                        },
                        "sender": {
                            "firstname": data.sender.fname,
                            "lastname": data.sender.lname,
                            "fullname": data.sender.fname + " " + data.sender.lname,
                            "postal_code": data.sender.pcode,
                            "phone": data.sender.tel,
                            "full_addr": data.sender.addr
                        },
                        "req_register": false
                    });

                    return request.post({
                        url: `${Config.PreloadUrl}/customer/v1/item`,
                        headers: {
                            auth_key: Config.PreloadKey
                        },
                        json: true,
                        body: {
                            "license_sub_no": null,
                            "order_no": data.ono,
                            "license_no": "0/2",
                            "items": mailingItems
                        }
                    });
                }
                else {
                    res.json(new ErrorModel(
                        httpResponse.ErrorMesg
                    ));
                    return;
                }
            })
            .then((httpResponse: PreloadResult) => {
                if (httpResponse.IsSuccess) {
                    let preloadItem = httpResponse.Data[0];
                    data.pid = preloadItem.ref_id;
                    return api.getNextSeq(this.db, this.packs.collectionName)
                }
                else {
                    throw new ErrorModel(
                        `${httpResponse.ErrorMesg}.`
                    );
                }
            })
            .then(packId => {
                data.id = packId;
                this.packs.insert(data);

                let recp = data.recp;
                let sender = data.sender;

                res.json({
                    "barcode": data.bcode,
                    "price": returnPrice,
                    "weight": bd.weight,
                    "service": data.sv,
                    "recipient": {
                        "first_name": recp.fname,
                        "last_name": recp.lname,
                        "postal_code": recp.pcode,
                        "phone": recp.tel,
                        "address": recp.addr
                    },
                    "sender": {
                        "first_name": sender.fname,
                        "last_name": sender.lname,
                        "postal_code": sender.pcode,
                        "phone": sender.tel,
                        "address": sender.addr
                    }
                });
            })
            .catch((err) => {
                if (err.statusCode) {
                    res.json(new ErrorModel(
                        `(${err.statusCode}) Unknown error.`
                    ));
                }
                else {
                    res.json(err);
                }
            });
    }

    create(req, res) {
        let bd = req.body;
        let now = new Date();
        let items: OrderItem[] = [];
        let recp = bd.recipient;
        let sender = bd.sender;
        let totalQty: number = 0;
        let totalPrice: number = 0;

        if (!recp) {
            res.json(new ErrorModel(
                "Recipient address is required."
            ));
            return;
        }

        if (!sender) {
            res.json(new ErrorModel(
                "Sender address is required."
            ));
            return;
        }

        if (!bd.ref_order) {
            res.json(new ErrorModel(
                "'ref_order' must be defined."
            ));
            return;
        }

        if (bd.items && bd.items.length > 0) {
            for (let i of bd.items) {
                if (!i.id) {
                    res.json(new ErrorModel(
                        "'item id' must be defined."
                    ));
                    return;
                }

                if (!i.qty) {
                    res.json(new ErrorModel(
                        "Item must defined quantity."
                    ));
                    return;
                }

                if (!i.price) {
                    res.json(new ErrorModel(
                        "Item must defined price."
                    ));
                    return;
                }

                items.push({
                    qty: i.qty,
                    price: mongodb.Decimal128.fromString(parseFloat(i.price).toFixed(2)),
                    item: {
                        rid: i.id,
                        name: i.name
                    }
                });
                totalQty += parseInt(i.qty);
                totalPrice += parseFloat(i.price);
            }
        }
        else {
            res.json(new ErrorModel(
                "At least 1 order required."
            ));
            return;
        }

        let data: OrderModel = {
            rno: bd.ref_order,
            qty: totalQty,
            price: mongodb.Decimal128.fromString(totalPrice.toFixed(2)),
            items: items,
            payment: true,
            recp: {
                fname: recp.first_name,
                lname: recp.last_name,
                pcode: recp.postal_code,
                tel: recp.phone,
                addr: recp.address
            },
            sender: {
                fname: sender.first_name,
                lname: sender.last_name,
                pcode: sender.postal_code,
                tel: recp.phone,
                addr: sender.address
            }
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
                data.cdate = mongodb.Long.fromNumber(now.getTime());
                data.edate = mongodb.Long.fromNumber(now.getTime());
                this.orders.insert(data);

                res.json({
                    order_no: data.no
                });
            }).catch((err) => {
                res.json(new ErrorModel(
                    `(${err.statusCode}) Unknown error.`
                ));
                return;
            });
    }
}