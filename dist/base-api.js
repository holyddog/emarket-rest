"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb = require("mongodb");
function getNextSeq(req, cname) {
    let opts = {
        upsert: true,
        returnOriginal: false
    };
    let coll = req.db.collection('counters');
    let fn = coll.findOneAndUpdate({ _id: cname }, { $inc: { seq: mongodb.Long.fromInt(1) } }, opts)
        .then(data => {
        return mongodb.Long.fromInt(data.value.seq);
    });
    return fn;
}
exports.getNextSeq = getNextSeq;
function checkDuplicate(coll, field, value) {
    let filter = {};
    filter[field] = { $regex: "^" + value + "$", $options: "i" };
    return coll.count(filter).then(count => {
        return count > 0;
    });
}
exports.checkDuplicate = checkDuplicate;
//# sourceMappingURL=base-api.js.map