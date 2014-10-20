'use strict';
var mongoose = require('mongoose'),
    User = mongoose.model('User');

/**
 * Generic require login routing middleware
 */
exports.requiresLogin = function (req, res, next) {

    var params = {
        phoneNumber: req.query._phoneNumber,
        token: req.query._token
    };
    if (!(params._phoneNumber && params._token))
        params = {
            phoneNumber: req.body._phoneNumber,
            token: req.body._token
        };

    User
        .findOne(params)
        .exec(function (err, user) {
            if (err) return next(err);
            if (user) req.user = user;
            if (!req.isAuthenticated())
                return res.send(401, 'User is not authorized');

            next();
        });
};

/**
 * Generic require Admin routing middleware
 * Basic Role checking - future release with full permission system
 */
exports.requiresAdmin = function (req, res, next) {
    if (!req.isAuthenticated() || !req.user.hasRole('admin')) {
        return res.send(401, 'User is not authorized');
    }
    next();
};