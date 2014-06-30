'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    userController = require(global.__base + 'controllers/users'),
    Q = require('q'),
    util = require('util');

//Globals
var user, user2;

//The tests
describe('<Unit Test>', function () {
    describe('Model User:', function () {
        before(function (done) {
            this.timeout(50000);
            var user1 = {
                name: 'Primo1',
                email: 'test@test.com',
                phoneNumber: '+393484650470',
                password: 'p',
                confirmPassword: 'p'
            };

            var user2 = {
                name: 'Secondo2',
                email: 'test@test.com',
                phoneNumber: '+393401405382',
                password: 'p',
                confirmPassword: 'p'
            };

            var stubReq1 = {
                validationErrors: function () {
                    return false;
                },
                logIn: function (user, done) {
                    done();
                },
                body: user1
            };
            var stubRes = {
                redirect: function () {
                    return true;
                }
            }
            userController.create(stubReq1, stubRes, "")
                .then(function () {
                    stubReq1.body = user2;
                    return Q.fcall(userController.create, stubReq1, stubRes, "");
                }).then(function () {
                    done();
                });
        });

        describe('Method SyncContacts', function () {
            it('should have before test user Primo1', function (done) {
                User.find({ phoneNumber: '+393484650470' }, function (err, users) {
                    users.should.have.length(1);
                    user = users[0];
                    done();
                });
            });

            it('should have before test user Secondo2', function (done) {
                User.find({ phoneNumber: '+393401405382' }, function (err, users) {
                    users.should.have.length(1);

                    user2 = users[0];
                    done();
                });
            });

            it('should create contacts', function (done) {
                this.timeout(50000);
                var contacts = {
                    "fre": "+393484650470",
                    "vecchio": "+393319149997",
                    "lalla": "+393401405382"
                };
                var stubReq = {
                    body: {
                        contacts: JSON.stringify(contacts)
                    },
                    user: user
                };
                var stubRes = {
                    jsonp: function () {
                        return true;
                    }
                }
                userController.syncContacts(stubReq, stubRes)
                    .then(function () {
                        stubReq.user = user2;
                        return Q.fcall(userController.syncContacts, stubReq, stubRes);
                    }).then(function () {
                        done();
                    });
            });
        });


        after(function (done) {
            this.timeout(50000);

            user.remove(function () {
                user2.remove(function () {
                    done();
                });
            });
//            user2.remove();
//            user && user2 && Q.all([
//                ])
//                .spread(function (a, b) {
//                    console.log(a, b);
////                    done();
//                }
//            )
//            ;
        });
    });
})
;
