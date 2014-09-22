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
    functions = require('./functions');

//Globals
var user, user2, user3, user4;


//The tests
describe('<Unit Test>', function () {
    describe('PopIndex:', function () {
        before(function (done) {
            this.timeout(50000);
            functions.initUser(4).then(function () {
                user = functions.getUser(0);
                user2 = functions.getUser(1);
                user3 = functions.getUser(2);
                user4 = functions.getUser(3);
                done();
            });
        });

        describe('Method popIndex', function () {
            it('should create contacts', function (done) {
                this.timeout(50000);

                var stubReq = [
                    {
                        body: {
                            contacts: JSON.stringify({
                                "vecchio": "+393319149997",
                                "lalla": "+393401405382"
                            })
                        },
                        user: functions.getUser(0)
                    },
                    {
                        body: {
                            contacts: JSON.stringify({
//                            "fre": "+393484650470",
                                "vecchio": "+393319149997"
                            })
                        },
                        user: functions.getUser(1)
                    },
                    {
                        body: {
                            contacts: JSON.stringify({
                                "fre": "+393484650470",
                                "lalla": "+393401405382"
                            })
                        },
                        user: functions.getUser(2)
                    },
                    {
                        body: {
                            contacts: JSON.stringify({
                                "fre": "+393484650470",
                                "vecchio": "+393319149997",
                                "lalla": "+393401405382"
                            })
                        },
                        user: functions.getUser(3)
                    }
                ];
                var stubRes = {
                    jsonp: function () {
                        return true;
                    }
                }
                userController.syncContacts(stubReq[0], stubRes)
                    .then(function () {
                        return Q.fcall(userController.syncContacts, stubReq[1], stubRes);
                    }).then(function () {
                        return Q.fcall(userController.syncContacts, stubReq[2], stubRes);
                    }).then(function () {
                        return Q.fcall(userController.syncContacts, stubReq[3], stubRes);
                    }).then(function () {
                        done();
                    });
            });
            it('should calculate popIndex', function (done) {
                this.timeout(30000);

                var stubReq = {
                    user: user
                };
                var stubRes = {
                    jsonp: function (jsonRsesponse) {
//                        jsonRsesponse.popIndex.should.be.approximately(15, 5);
                        return true;
                    }
                }
                userController.popIndex(stubReq, stubRes)
                    .then(function () {
                        done();
                    })
            });
        });

        after(function (done) {
            this.timeout(50000);
console.log("deleting");
//            functions.removeUsers()
//                .then(function () {
//                    done();
//                });

        });
    });
});
