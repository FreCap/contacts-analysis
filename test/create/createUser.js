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
    functions = require('../functions');

//Globals
var user, user2;


//The tests
describe('<Unit Test>', function () {
    describe('controller Create:', function () {

        it('should create 5 users', function (done) {
            this.timeout(50000);

            functions.initUser(5).delay(500).then(function () {
                done();
            });
        });

        it('should create rels', function (done) {
            this.timeout(50000);

            functions.addRelationships().then(function () {
                done();
            });
        });

        it('should create stats index', function (done) {
            this.timeout(50000);

            User.find_byStatslastUpdated().then(function (users) {
                var queries = [];
                users.forEach(function (a) {
                    queries.push(a.statsCalculator().total())
                });
                Q.all(queries).then(function (b) {
                    done();
                });
            })
        });

    });
});
