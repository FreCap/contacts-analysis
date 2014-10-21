/**
 * Created by fre on 01/07/14.
 */
var should = require('should'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    userController = require(global.__base + 'controllers/users'),
    Q = require('q'),
    util = require('util');

var usersModel = [
    {
        personal: {name: 'Primo1', surname: "fre"},
        email: 'test@test.com',
        phoneNumber: '+393484650470',
        password: 'p',
        confirmPassword: 'p',
        tags: ["exampletag1", "all"]
    },
    {
        personal: {name: 'Secondo2', surname: "laura"},
        email: 'test@test.com',
        phoneNumber: '+393401405382',
        password: 'p',
        confirmPassword: 'p',
        tags: ["exampletag", "all"]
    },
    {
        personal: {name: 'Terzo3', surname: "mirco"},
        email: 'test@test.com',
        phoneNumber: '+393319149997',
        password: 'p',
        confirmPassword: 'p',
        tags: ["exampletag", "all"]
    },
    {
        personal: {name: 'Quarto4', surname: "vecchio"},
        email: 'test@test.com',
        phoneNumber: '+393396507813',
        password: 'p',
        confirmPassword: 'p',
        tags: ["all"]
    },
    {
        personal: {name: 'Quinto5', surname: "vecchio"},
        email: 'test@test.com',
        phoneNumber: '+390542665008',
        password: 'p',
        confirmPassword: 'p',
        tags: ["all", "ma"]
    }
];

var usersInstance = [];

module.exports.initUser = function (number) {
    if (number == 0) {
        usersInstance.reverse();
        return Q({});
    }

    var stubReq1 = {
        validationErrors: function () {
            return false;
        },
        logIn: function (user, done) {
            done();
        },
        body: usersModel[number - 1]
    };
    var stubRes = {
        redirect: function () {
            return true;
        }
    }
    return userController.create(stubReq1, stubRes, "")
        .then(function () {
            return Q.ninvoke(User, "findOne", { phoneNumber: usersModel[number - 1].phoneNumber });
        }).then(function (users) {
            usersInstance.push(users);
            return Q.fcall(module.exports.initUser, number - 1);
        })
};

var getUser = module.exports.getUser = function (nId) {
    return usersInstance[nId];
};

module.exports.removeUsers = function () {
    var next = function (id) {
        if (id < 0) {
            usersInstance = [];
            return Q({});
        }
        return Q.ninvoke(usersInstance[id], "remove")
            .then(function () {
                return next(id - 1);
            });
    };
    return next(usersInstance.length - 1);
}


module.exports.addRelationships = function () {

    var stubReq = [
        {body: {contacts: JSON.stringify({
            "vecchio": "+393319149997",
            "lalla": "+393401405382"
        })},
            user: getUser(0)},
        {body: {contacts: JSON.stringify({
//                            "fre": "+393484650470",
            "vecchio": "+393319149997"
        })},
            user: getUser(1)},
        {body: {contacts: JSON.stringify({
            "fre": "+393484650470",
            "lalla": "+393401405382"
        })},
            user: getUser(2)},
        {body: {contacts: JSON.stringify({
            "fre": "+393484650470",
            "vecchio": "+393319149997",
            "lalla": "+393401405382"
        })},
            user: getUser(3)},
        {body: {contacts: JSON.stringify({
            "fre": "+393484650470",
            "vecchio": "+393319149997",
            "lalla": "+393401405382"
        })},
            user: getUser(4)}
    ];
    var stubRes = {
        jsonp: function () {
            return true;
        }
    }
    return Q.all([
        userController.syncContacts(stubReq[0], stubRes),
        userController.syncContacts(stubReq[1], stubRes),
        userController.syncContacts(stubReq[2], stubRes),
        userController.syncContacts(stubReq[3], stubRes),
        userController.syncContacts(stubReq[4], stubRes)
    ])

}
// FLUSH MATCH (n:`users`) OPTIONAL MATCH (n)-[r]-() DELETE n,r