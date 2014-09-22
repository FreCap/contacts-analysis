'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Q = require('q'),
    Schema = mongoose.Schema;
var ObjectId = require('mongoose').Types.ObjectId;

var Stats;

/**
 * Article Schema
 */
var StatsSchema = new Schema({
    stats: {
        wanted: Number,
        power: Number,
        popularity: Number,
        fancy: Number,
        total: Number,
        lastUpdate: Date
    },
    created: {
        type: Date,
        default: Date.now
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    }
});

StatsSchema.statics.history_byUser = function (user) {
    var deferred = Q.defer();
    Stats.aggregate([
        {"$match": {user: ObjectId.createFromHexString(user.id)}},
        { "$sort": { created: 1} },
        {
            "$group": {
                "_id": {
                    year: {
                        "$year": "$created"
                    },
                    month: {
                        "$month": "$created"
                    },
                    day: {
                        "$dayOfMonth": "$created"
                    }
                },
                "stats": {
                    "$last": "$stats"
                }
            }
        }
    ], deferred.makeNodeResolver());
    return deferred.promise;
};

StatsSchema.statics.remove_byUser = function (user) {
    return Q.ninvoke(this, "remove",
        { user: ObjectId.createFromHexString(user.id) });

};

Stats = mongoose.model('Stats', StatsSchema);
