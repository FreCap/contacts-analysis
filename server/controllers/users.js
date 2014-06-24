'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Q = require('q');

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

    user.setPassword(req.body.password)
        .then(function () {
            console.log(user);
            crypto.randomBytes(48, function (ex, buf) {
                var token = buf.toString('hex');
                user.token = token;
            });
            return Q.ninvoke(user, 'save');
        })
        .fail(function (err) {
            switch (err.code) {
                case 11000:
                case 11001:
                    message = 'email already exists';
                    break;
                default:
                    message = err.message;
            }

            return res.render('users/signup', {
                message: message,
                user: user
            });
        }).then(function(){
            return Q.ninvoke(user, 'addToNeo');
        })
        .then(function () {
            return Q.ninvoke(req, 'logIn', user);
        })
        .then(function () {
            return res.redirect('/');
        })
        .fail(next)
        .done();
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

exports.addContacts = function (req, res) {
    req.user.mergeContacts(req.body.contacts);

};

exports.addContacts = function (req, res) {
    req.user.mergeContacts(req.body.contacts);

};
