import * as mongodb from 'mongodb';

import { AddressModel } from './address.model';
import { OrderItem } from './order.model';
import { ServiceTypeModel } from './service-type.model';

export class PackModel {
    id?: number;
    ono?: string; // order no
    price?: mongodb.Decimal128;
    weight?: mongodb.Decimal128;
    sv?: ServiceTypeModel;
    bcode?: string;
    pid?: string; // preload id
    items?: OrderItem[];
    recp?: AddressModel;
    sender?: AddressModel;
}