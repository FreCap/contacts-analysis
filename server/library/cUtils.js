var _ = require('lodash');
var Q = require('q');
var util = require('util');

var descendants = exports.descendants = function (obj, exludes) {
    exludes = util.isArray(exludes)? exludes : [exludes];
    var strings = Object.keys(obj).map(function (key) {
        var value = obj[key];
        if (typeof value === 'object' && !util.isArray(value)) {
            return descendants(value).map(function (desc) {
                return key + '.' + desc;
            });
        }
        return [key];
    }).reduce(function (a, b) {
        return a.concat(b);
    });
    var response = [];
    strings.forEach(function (v) {
        var valid = true;
        if (util.isArray(exludes))
            exludes.forEach(function (e) {
                if (v.indexOf(e) == 0)
                    valid = false;
            })
        if (valid)
            response.push(v);
    })
    return response;
}

exports.reflectionSet = function(obj, propString, value){
    var current = obj;
    var splitted = propString.split('.');
    splitted.forEach(function(k){
        current = current[k];
    })
    current = value;
}