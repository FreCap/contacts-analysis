'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Q = require('q'),
    crypto = require('crypto');
var Stats = mongoose.model('Stats');

/**
 * Auth callback
 */
exports.authCallback = function (req, res) {
    res.redirect('/');
};

/**
 * Show login form
 */
exports.signin = function (req, res) {
    res.render('users/signin', {
        title: 'Signin',
        message: req.flash('error')
    });
};

/**
 * Show sign up form
 */
exports.signup = function (req, res) {
    res.render('users/signup', {
        title: 'Sign up',
        user: new User()
    });
};

/**
 * Logout
 */
exports.signout = function (req, res) {
    req.logout();
    res.redirect('/');
};

/**
 * Session
 */
exports.session = function (req, res) {
    res.redirect('/');
};

/**
 * Create user
 */
exports.create = function (req, res, next) {
    var user = new User(req.body);
    var message = null;

//    req.assert('name', 'You must enter a name').notEmpty();
//    req.assert('email', 'You must enter a valid email address').isEmail();
//    req.assert('password', 'Password must be between 8-20 characters long').len(8, 20);
//    req.assert('username', 'Username cannot be more than 20 characters').len(1, 20);
//    req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

    var errors = req.validationErrors();
    if (errors) {
        return res.status(400).send(errors);
    }

    return user.setPassword(req.body.password)
        .then(function () {
            user.token = crypto.randomBytes(32).toString('hex');
            return Q.ninvoke(user, 'save');
        })
        .then(function () {
            return user.addToNeo();
        })
        .then(function () {
            return Q.ninvoke(req, 'logIn', user);
        })
        .then(function () {
            return res.redirect('/');
        }).fail(function (err) {
            switch (err.code) {
                case 11000:
                case 11001:
                    message = 'phone Number already exists';
                    break;
                default:
                    message = err.message;
            }
            return res.status(400).send([
                {msg: message}
            ]);
        })
        .fail(next);
};

/**
 * Send User
 */
exports.me = function (req, res) {
    res.jsonp(req.user || null);
};

/**
 * Find user by id
 */
exports.user = function (req, res, next, id) {
    User
        .findOne({
            _id: id
        })
        .exec(function (err, user) {
            if (err) return next(err);
            if (!user) return next(new Error('Failed to load User ' + id));
            req.profile = user;
            next();
        });
};

// ############## REST ##############

exports.distance = function (req, res) {
    User.find_byPhoneNumber(req.body.to, function (userTo) {
        req.user.distance(userTo);
    });
};

exports.syncContacts = function (req, res) {
    res.jsonp({success: true});
    var contactsRAW = JSON.parse(req.body.contacts);
    var contacts = [];

    for (var k in contactsRAW) {
        contacts.push({
            name: k,
            phoneNumber: contactsRAW[k]
        });
    }
    return req.user.mergeContacts(contacts)
        .then(function () {
            res.jsonp({
                success: true
            });
        });
};

exports.popIndex = function (req, res) {
    var user = req.user;
    return user.statsCalculator().total()
        .then(function (popIndexValue) {
            var stats = user.statsGet();
            return res.jsonp({
                success: true,
                popIndex: popIndexValue,
                wanted: stats.wanted / popIndexValue * 100,
                power: stats.power / popIndexValue * 100,
                popularity: stats.popularity / popIndexValue * 100,
                fancy: stats.fancy / popIndexValue * 100

            });
        })
};

exports.popIndexHistory = function (req, res) {
    var user = req.user;
    return Stats.history_byUser(user).then(function (history) {
        var response = [];
        history.forEach(function (value) {
            response.push({
                year: value._id.year,
                month: value._id.month,
                day: value._id.day,
                stats: value.getComputed()
            })
        });
        res.jsonp(response);
    })
};

exports.find = function (req, res) {
//    console.log(req.search)
//    console.log(req.body)
//    console.log(req.query)
    var user = req.user;
    req.assert('search', 'You must enter a name').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        return res.status(400).send(errors);
    }

    User.find_byName(req.body.search)
        .then(function (results) {
            if (results.results.length == 0)
                return res.jsonp({
                    success: true,
                    results: []
                });
            var distanceQueuePromises = [];
            var response = [];
            results.results.forEach(function (value) {
                var userFound = value.obj;
                response.push({
                    personal: userFound.personal,
                    tags: userFound.tags,
                    distance: null,
                    popIndex: userFound.statsGet().total
                });
                userFound.statsCalculator().total();
                distanceQueuePromises.push(user.distance(userFound));
            });
            return Q.all(distanceQueuePromises)
                .then(function (values) {
                    var i = 0;
                    values.forEach(function (dist) {
//                        console.log(i, response[i]);
                        response[i++].distance = dist;
                    });
                    res.jsonp({
                        success: true,
                        results: response
                    });
                })
        });
};