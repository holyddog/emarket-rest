import * as mongodb from 'mongodb';

import * as api from '../base-api';
import { Config } from '../config';

export class CategoryApi {
    private categories: mongodb.Collection;
    private db: mongodb.Db;

    constructor(db: mongodb.Db) {
        this.db = db;
        this.categories = db.collection('categories');
    }

    findMainCategories(req, res) {
        this.categories.find({ pid: { $exists: 0 } }, { _id: 0 }).sort({ seq: 1 }).toArray().then(
            data => res.json(data)
        );
    }
}