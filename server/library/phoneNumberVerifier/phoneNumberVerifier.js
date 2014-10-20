var _ = require('lodash');
var Q = require('q');
var util = require('util');
var Set = require("collections/set");
var http = require('http');

var URL_newNumber = '/number/new';
var URL_statusNumber = '/number/status';
var URL_confirmNumber = '/number/confirm';


var getDefaultOptions = function () {
    return JSON.parse(JSON.stringify(options));
};

var req = function (url, postData) {
    var deferred = Q.defer();
    http.post({
        uri: url,
        headers: {'content-type': 'application/x-www-form-urlencoded'},
        body: require('querystring').stringify(postData)
    }, function (err, res, body) {
        deferred.resolve(JSON.parse(body));
    });
    return deferred.promise;
};

exports.newNumber = function (phoneNumber) {
    return req(URL_statusNumber, {
        phoneNumber: phoneNumber
    }).then(function () {

    });
};


exports.statusNumber = function (phoneNumber) {
    return req(URL_confirmNumber, {
        phoneNumber: phoneNumber
    }).then(function () {

    });
};


exports.confirmNumber = function (phoneNumber, secretCode) {
    return req(URL_newNumber, {
        phoneNumber: phoneNumber,
        secretCode: secretCode
    }).then(function () {

    });
};

