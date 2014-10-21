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
var user, user2, user3, user4;


//The tests
describe('<Unit Test>', function () {
    describe('Search:', function () {
        before(function (done) {
            this.timeout(10000);
            functions.initUser(4).then(function () {
                user = functions.getUser(0);
                user2 = functions.getUser(1);
                user3 = functions.getUser(2);
                user4 = functions.getUser(3);
                done();
            });
        });

        describe('Method search', function () {
            it('should find 1 contact', function (done) {
                this.timeout(10000);

                User.find_byName("Primo1 fre")
                    .then(function (result) {
                        result.results.should.have.length(1);
                        done()
                    }).fail(function (err) {
                        console.log("You must set 'setParameter = textSearchEnabled=true' in /etc/mongodb.conf probably");
                        console.log(err);
                        throw err;
                    })
            });
            it('should find 1 contacts', function (done) {
                this.timeout(10000);

                User.find_byName("exampletag1")
                    .then(function (result) {
                        result.results.should.have.length(1);
                        done()
                    }).fail(function (err) {
                        console.log("You must set 'setParameter = textSearchEnabled=true' in /etc/mongodb.conf probably");
                        console.log(err);
                        throw err;
                    })
            });
            it('should find 2 contacts', function (done) {
                this.timeout(10000);

                User.find_byName("exampletag")
                    .then(function (result) {
                        result.results.should.have.length(2);
                        done()
                    }).fail(function (err) {
                        console.log("You must set 'setParameter = textSearchEnabled=true' in /etc/mongodb.conf probably");
                        console.log(err);
                        throw err;
                    })
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
