'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Q = require('q');
var ObjectId = require('mongoose').Types.ObjectId;

var Search;
/**
 * Search Schema
 */
var SearchSchema = new Schema({
    createdTime: {
        type: Date,
        default: Date.now
    },
    query: String,
    userSearched: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    }

});

/**
 * Statics
 */
SearchSchema.statics.load = function (id, cb) {
    this.findOne({
        _id: id
    }).populate('user', 'userSearched').exec(cb);
};


SearchSchema.statics.find_byUserSeached = function (user, callback, callbackError) {
    this.find({
        userSearched: ObjectId.createFromHexString(user.id)
    }).populate('user', 'userSearched').exec(function (err, searches) {
            if (err) {
                callbackError(err);
            } else {
                callback(searches);
            }
        });
};

SearchSchema.statics.remove_byUser = function (user) {
    return Q.ninvoke(this, "remove",
        { user: ObjectId.createFromHexString(user.id) });

};

Search = mongoose.model('Search', SearchSchema);
