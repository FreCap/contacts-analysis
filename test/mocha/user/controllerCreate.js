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
    describe('controller Create:', function () {
        before(function (done) {
            this.timeout(10000);
            functions.initUser(2).then(function () {
                done();
            });
        });

        describe('Method Should have created', function () {
            it('Primo1', function (done) {
                user = functions.getUser(0);
                should.exist(user);
                done();
            });

            it('Secondo2', function (done) {
                user2 = functions.getUser(1);
                should.exist(user2);
                done();
            });


        });

        after(function (done) {
            this.timeout(10000);
            functions.removeUsers()
                .then(function () {
                    done();
                });
        });
    });
});
