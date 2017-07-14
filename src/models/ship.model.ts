import * as mongodb from 'mongodb';

import { ServiceTypeModel } from './service-type.model';

export class ShipModel {
    name?: string;
    price?: mongodb.Decimal128;    
    sv?: ServiceTypeModel;
}