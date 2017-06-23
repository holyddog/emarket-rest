import * as mongodb from 'mongodb';

export function getNextSeq(req, cname): Promise<any> {
    let opts: mongodb.FindOneAndReplaceOption = {
        upsert: true,
        returnOriginal: false
    };
    let coll: mongodb.Collection = req.db.collection('counters');
    let fn = coll.findOneAndUpdate({ _id: cname }, { $inc: { seq: mongodb.Long.fromInt(1) } }, opts)
        .then(data => {
            return mongodb.Long.fromInt(data.value.seq);
        });
    return fn;
}

export function checkDuplicate(coll: mongodb.Collection, field: string, value: any): Promise<any> {
    let filter = {};
    filter[field] = { $regex: "^" + value + "$", $options: "i" };
    return coll.count(filter).then(count => {
        return count > 0;
    });
}