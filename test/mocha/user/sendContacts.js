'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    userController = require(global.__base + 'controllers/users'),
    Q = require('q'),
    util = require('util'),
    functions = require('../../functions');

//Globals
var user, user2;


//The tests
describe('<Unit Test>', function () {
    describe('SendContacts:', function () {
        before(function (done) {
            this.timeout(10000);
            functions.initUser(2).then(function () {
                done();
            });
        });

        describe('Method SyncContacts', function () {
            it('should have before test user Primo1', function (done) {
                user = functions.getUser(0);
                should.exist(user)
                done();
            });

            it('should have before test user Secondo2', function (done) {
                user2 = functions.getUser(1);
                should.exist(user2);
                done();
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

            functions.removeUsers()
                .then(function () {
                done();
            });

        });
    });
});
