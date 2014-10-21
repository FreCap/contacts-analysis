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
        ranks: {
            computed: {
                averageContactsIndex: {type: Number, default: 0},
                wanted: {type: Number, default: 0},
                power: {type: Number, default: 0},
                popularity: {type: Number, default: 0},
                fancy: {type: Number, default: 0},
                total: {type: Number, default: 0},
                lastUpdate: Date
            },
            searched: {type: Number, default: 0},
            peopleReachable: {
                countStep1: {type: Number, default: 0},
                countStep2: {type: Number, default: 0},
                lastUpdate: Date
            },
            peopleReachMe: {
                countStep1: {type: Number, default: 0},
                countStep2: {type: Number, default: 0},
                lastUpdate: Date
            }
        },
        computed: {
            averageContactsIndex: {type: Number, default: 0},
            wanted: {type: Number, default: 0},
            power: {type: Number, default: 0},
            popularity: {type: Number, default: 0},
            fancy: {type: Number, default: 0},
            total: {type: Number, default: 0},
            lastUpdate: Date
        },
        searched: {type: Number, default: 0},
        peopleReachable: {
            countStep1: {type: Number, default: 0},
            countStep2: {type: Number, default: 0},
            lastUpdate: Date
        },
        peopleReachMe: {
            countStep1: {type: Number, default: 0},
            countStep2: {type: Number, default: 0},
            lastUpdate: Date
        }
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


StatsSchema.methods = {
    getComputed: function () {
        var stat = this,
            computed = stat.stats.computed;
        return {
            wanted: computed.wanted ? computed.wanted : 0,
            power: computed.power ? computed.power : 0,
            popularity: computed.popularity ? computed.popularity : 1,
            fancy: computed.wanted ? computed.fancy : 0,
            total: computed.total ? computed.total : 0
        }
    }
}


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


StatsSchema.statics.find_last_byUser = function (user) {
    var deferred = Q.defer();
    Stats.findOne()
        .sort({"created": 'desc'})
        .exec(function (err, stat) {
            if (err)
                return err;
            return deferred.resolve(stat);
        });
    return deferred.promise;
};


StatsSchema.statics.remove_byUser = function (user) {
    return Q.ninvoke(this, "remove",
        { user: ObjectId.createFromHexString(user.id) });

};

Stats = mongoose.model('Stats', StatsSchema);
