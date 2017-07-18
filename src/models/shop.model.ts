import * as mongodb from 'mongodb';

export class ShopModel {
    id?: number;
    uid?: mongodb.Long;
    name?: string;
    url?: string;
    desc?: string;
}