'use strict';

// User routes use users controller
var users = require('../controllers/users');
var authorization = require('./middlewares/authorization');

module.exports = function (app, passport) {

    app.route('/logout')
        .get(users.signout);
    app.route('/users/me')
        .get(authorization.requiresLogin, users.me);

    app.route('/syncContacts')
        .post(authorization.requiresLogin, users.syncContacts);

    app.route('/popIndex')
        .post(authorization.requiresLogin, users.popIndex);

    app.route('/popIndexHistory')
        .post(authorization.requiresLogin, users.popIndexHistory);

    app.route('/find')
        .post(authorization.requiresLogin, users.find);

//    app.route('me/popIndex')
//        .get(authorization.requiresLogin, users.popIndex)

    // Setting up the users api
    app.route('/register')
        .post(users.create);

    // Setting up the userId param
    app.param('userId', users.user);

    // AngularJS route to check for authentication
    app.route('/loggedin')
        .get(function (req, res) {
            res.send(req.isAuthenticated() ? req.user : '0');
        });

    // Setting the local strategy route
    app.route('/login')
        .post(passport.authenticate('local', {
        failureFlash: true
    }), function (req, res) {
            res.send({
                phoneNumber: req.user.phoneNumber,
                token: req.user.token
            });
        });

//    // Setting the facebook oauth routes
//    app.route('/auth/facebook')
//        .get(passport.authenticate('facebook', {
//            scope: ['email', 'user_about_me'],
//            failureRedirect: '#!/login'
//        }), users.signin);
//
//    app.route('/auth/facebook/callback')
//        .get(passport.authenticate('facebook', {
//            failureRedirect: '#!/login'
//        }), users.authCallback);
//
//    // Setting the github oauth routes
//    app.route('/auth/github')
//        .get(passport.authenticate('github', {
//            failureRedirect: '#!/login'
//        }), users.signin);
//
//    app.route('/auth/github/callback')
//        .get(passport.authenticate('github', {
//            failureRedirect: '#!/login'
//        }), users.authCallback);
//
//    // Setting the twitter oauth routes
//    app.route('/auth/twitter')
//        .get(passport.authenticate('twitter', {
//            failureRedirect: '#!/login'
//        }), users.signin);
//
//    app.route('/auth/twitter/callback')
//        .get(passport.authenticate('twitter', {
//            failureRedirect: '#!/login'
//        }), users.authCallback);
//
//    // Setting the google oauth routes
//    app.route('/auth/google')
//        .get(passport.authenticate('google', {
//            failureRedirect: '#!/login',
//            scope: [
//                'https://www.googleapis.com/auth/userinfo.profile',
//                'https://www.googleapis.com/auth/userinfo.email'
//            ]
//        }), users.signin);
//
//    app.route('/auth/google/callback')
//        .get(passport.authenticate('google', {
//            failureRedirect: '#!/login'
//        }), users.authCallback);
//
//    // Setting the linkedin oauth routes
//    app.route('/auth/linkedin')
//        .get(passport.authenticate('linkedin', {
//            failureRedirect: '#!/login',
//            scope: [ 'r_emailaddress' ]
//        }), users.signin);
//
//    app.route('/auth/linkedin/callback')
//        .get(passport.authenticate('linkedin', {
//            failureRedirect: '#!/login'
//        }), users.authCallback);

};
