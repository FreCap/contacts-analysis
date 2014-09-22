'use strict';

var mean = require('meanio');
var neo4j = require(__base + 'library/neo4j/neo4j');
var Q = require('q')

var mongoose = require('mongoose'),
    User = mongoose.model('User'),
Stats = mongoose.model('Stats');
exports.render = function (req, res) {


    User.find_byPhoneNumber("+393401405382", function (user) {
        Stats.history_byUser(user).then(function (history) {
            var response = [];
            history.forEach(function (value) {
                response.push({
                    year: value._id.year,
                    month: value._id.month,
                    day: value._id.day,
                    stats: value.stats
                })
            });
            res.jsonp(response);
        })

    })

    // Send some basic starting info to the view


};

exports.renderPost = function (req, res) {
    console.log(req.body);
    res.jsonp(req.body);
    // Send some basic starting info to the view


};
