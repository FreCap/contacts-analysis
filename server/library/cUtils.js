var _ = require('lodash');
var Q = require('q');
var util = require('util');
var Reflect = require('reflect');


var descendants = exports.descendants = function (obj, exludes) {
    exludes = util.isArray(exludes) ? exludes : [exludes, "toObject"];
    var keys = Object.keys(obj),
        strings = [];
    if (keys && keys.length > 0)
        strings = keys.map(function (key) {
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
                if (v.indexOf(e) > -1)
                    valid = false;
            })
        if (valid)
            response.push(v);
    })
    return response;
}

exports.reflectionSet = function (obj, prop, value) {
    prop = prop.split('.');
    var root = obj, i;
    for (i = 0; i < prop.length; i++) {
        if (typeof root[prop[i]] == 'undefined') root[prop[i]] = {};
        if (i === prop.length - 1) root[prop[i]] = value;
        root = root[prop[i]];
    }
    return obj;
};


exports.reflectionGet = function (obj, prop) {
    prop = prop.split('.');
    var root = obj, i;
    for (i = 0; i < prop.length; i++) {
        if (typeof root[prop[i]] == 'undefined') root[prop[i]] = {};
        if (i === prop.length - 1) return root[prop[i]];
        root = root[prop[i]];
    }
    return obj;
};