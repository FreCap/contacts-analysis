'use strict';

var mongoose = require('mongoose'),
    LocalStrategy = require('passport-local').Strategy,
    TwitterStrategy = require('passport-twitter').Strategy,
    FacebookStrategy = require('passport-facebook').Strategy,
    GitHubStrategy = require('passport-github').Strategy,
    GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
    LinkedinStrategy = require('passport-linkedin').Strategy,
    User = mongoose.model('User'),
    config = require('./config'),
    _ = require('lodash');

module.exports = function (passport) {

    // Serialize the user id to push into the session
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    // Deserialize the user object based on a pre-serialized token
    // which is the user id
    passport.deserializeUser(function (id, done) {
        User.findOne(
            {_id: id},
            '-salt -hashed_password',
            done
        );
    });

    // Use local strategy
    passport.use(new LocalStrategy({
            usernameField: 'phoneNumber',
            passwordField: 'password'
        },
        function (phoneNumber, password, done) {
            User.findOne({
                phoneNumber: phoneNumber
            }, function (err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    return done(null, false, {
                        message: 'Unknown user'
                    });
                }
                user.authenticate(password).then(function (verified) {
                    if (verified)
                        return done(null, user);

                    return done(null, false, {
                        message: 'Invalid password'
                    });
                });
            });
        }
    ));

    var socialLoginCB = function (token, tokenSecret, profile, done) {
        var query = {};
        query[profile.provider + '.id'] = profile.id;

        User.findOne(
            query,
            '-salt -hashed_password',
            function (err, user) {
                if (err) return done(err);

                if (!user) {
                    var emails = _.pluck(profile.emails, 'value');
                    User.findOne(
                        {email: {$in: emails}},
                        '-salt -hashed_password',
                        function (err, user) {
                            if (err) return done(err);

                            if (!user) {
                                user = new User({
                                    name: profile.displayName,
                                    email: emails[0]
                                });
                            }

                            user[profile.provider] = _.omit(profile, ['_raw', '_json']);

                            user.save(done);
                        }
                    );
                } else {
                    profile = _.omit(profile, ['_raw', '_json']);

                    if (!_.isEqual(user[profile.provider], profile)) {
                        user[profile.provider] = profile;
                        user.save(done);
                    }

                    return done(err, user);
                }
            }
        );
    }

//    // Use facebook strategy
//    passport.use(new FacebookStrategy({
//            clientID: config.facebook.clientID,
//            clientSecret: config.facebook.clientSecret,
//            callbackURL: config.facebook.callbackURL,
//            profileFields: ['id', 'username', 'displayName', 'name', 'gender', 'birthday', 'profileUrl', 'emails', 'photos']
//        },
//        socialLoginCB
//    ));
//
//    // Use google strategy
//    passport.use(new GoogleStrategy({
//            clientID: config.google.clientID,
//            clientSecret: config.google.clientSecret,
//            callbackURL: config.google.callbackURL
//        },
//        socialLoginCB
//    ));
//
//    // use linkedin strategy
//    passport.use(new LinkedinStrategy({
//            consumerKey: config.linkedin.clientID,
//            consumerSecret: config.linkedin.clientSecret,
//            callbackURL: config.linkedin.callbackURL,
//            profileFields: ['id', 'first-name', 'last-name', 'email-address']
//        },
//        function (accessToken, refreshToken, profile, done) {
//            User.findOne({
//                'linkedin.id': profile.id
//            }, function (err, user) {
//                if (!user) {
//                    user = new User({
//                        name: profile.displayName,
//                        email: profile.emails[0].value,
//                        username: profile.emails[0].value,
//                        provider: 'linkedin'
//                    });
//                    user.save(function (err) {
//                        if (err) console.log(err);
//                        return done(err, user);
//                    });
//                } else {
//                    return done(err, user);
//                }
//            });
//        }
//    ));


};
