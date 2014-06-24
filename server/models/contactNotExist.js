'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


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
    names: [{
        type: String,
        default: '',
        trim: true
    }],
    inContactsOf: [
        {
            type: Schema.ObjectId,
            ref: 'User'
        }
    ]
});

/**
 * Statics
 */
ContactNotExistSchema.statics.load = function (id, cb) {
    this.findOne({
        _id: id
    }).populate('inContactsOf', 'phoneNumber').exec(cb);
};


ContactNotExistSchema.statics.find_byPhoneNumber = function (phoneNumber, callback, callbackError) {
    this.findOne({
        phoneNumber: phoneNumber
    }).populate('inContactsOf', 'phoneNumber').exec(function (err, contact) {
            if (err) {
                callbackError(err);
            } else {
                callback(contact);
            }
        });
};

ContactNotExistSchema.statics.create = function(phoneNumber, inContactsOfUser, name){
    var newObj = new ContactNotExistSchema({names:[name], inContactsOf: [inContactsOfUser], phoneNumber:phoneNumber });
    newObj.save();
}

mongoose.model('ContactNotExist', ContactNotExistSchema);
