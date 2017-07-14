import * as mongodb from 'mongodb';

import { ShipModel } from './ship.model';

export class ItemModel {
    id?: number;
    rid?: number;
    name?: number;
    desc?: string;
    price?: mongodb.Decimal128;
    pic?: string;
    pics?: string[];
    ships?: ShipModel[];
}