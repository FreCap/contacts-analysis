'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Q = require('q');
var ObjectId = require('mongoose').Types.ObjectId;

var ContactNotExist;
/**
 * ContactNotExist Schema
 */
var ContactNotExistSchema = new Schema({
    createdTime: {
        type: Date,
        default: Date.now
    },
    phoneNumber: {
        type: String,
        default: '',
        trim: true
    },
    name: {
        type: String,
        default: '',
        trim: true
    },
    inContactsOf: {
        type: Schema.ObjectId,
        ref: 'User'
    }

});

ContactNotExistSchema.index({phoneNumber: 1, inContactsOf: 1}, {unique: true});


/**
 * Statics
 */
ContactNotExistSchema.statics.load = function (id, cb) {
    this.findOne({
        _id: id
    }).populate('inContactsOf', 'phoneNumber').exec(cb);
};


ContactNotExistSchema.statics.find_byPhoneNumber = function (phoneNumber, callback, callbackError) {
    this.find({
        phoneNumber: phoneNumber
    }).populate('inContactsOf', 'phoneNumber').exec(function (err, contacts) {
            if (err) {
                callbackError(err);
            } else {
                callback(contacts);
            }
        });
};

ContactNotExistSchema.statics.create = function (phoneNumber, inContactsOfUser, name) {
    var deferred = Q.defer();
    this.find({
        inContactsOf: ObjectId.createFromHexString(inContactsOfUser.id),
        phoneNumber: phoneNumber
    }).exec(function (err, contacts) {
            if (err)
                return err;

            if (contacts && contacts.length > 0)
                return deferred.resolve();

            var newObj = new ContactNotExist({
                name: name,
                inContactsOf: inContactsOfUser,
                phoneNumber: phoneNumber
            });
            newObj.save(function (err, doc) {
                return deferred.resolve();
            });
        });

    return deferred.promise;
}

ContactNotExistSchema.statics.remove_byUser = function (user) {
    return Q.ninvoke(this, "remove",
        { inContactsOf: ObjectId.createFromHexString(user.id) });

};

ContactNotExist = mongoose.model('ContactNotExist', ContactNotExistSchema);
