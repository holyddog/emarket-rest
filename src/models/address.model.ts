import * as mongodb from 'mongodb';

export class AddressModel {
    id?: number;
    uid?: mongodb.Long;
    sid?: mongodb.Long;
    name?: string;
    addr?: string;
    faddr?: string;
    city?: string;
    pv?: ProvinceModel;
    pcode?: string;
    tel?: string;
    def?: boolean;
}

export class ProvinceModel {
    id?: number;
    name?: string;
}