'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Q = require('q'),
    crypto = require('crypto');

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
    req.user.distance(req.body.to);
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
    return req.user.popIndex()
        .then(function (popIndexValue) {
            res.jsonp({
                success: true,
                popIndex: popIndexValue
            });
        })
};