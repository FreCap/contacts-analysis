'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


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

mongoose.model('Stats', StatsSchema);
