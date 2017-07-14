import * as mongodb from 'mongodb';

import { ItemModel } from './item.model';
import { AddressModel } from './address.model';
import { PaymentOptionModel } from './payment-option.model';

export class OrderItem {
    price?: mongodb.Decimal128;
    sprice?: mongodb.Decimal128;
    qty?: number;
    item?: ItemModel;
}

export class OrderModel {
    id?: number;
    no?: string;
    rno?: string;
    cdate?: mongodb.Long;
    edate?: mongodb.Long;
    cby?: mongodb.Long;
    eby?: mongodb.Long;
    qty?: number;
    price?: mongodb.Decimal128; // product price
    sprice?: mongodb.Decimal128; // shipping price
    nprice?: mongodb.Decimal128; // net price
    items?: OrderItem[]; // id, name
    payment?: boolean;
    popt?: PaymentOptionModel;
    recp?: AddressModel;
    sender?: AddressModel;
}