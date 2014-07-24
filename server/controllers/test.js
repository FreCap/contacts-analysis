'use strict';

var mean = require('meanio');
var neo4j = require(__base + 'library/neo4j/neo4j');
var Q = require('q')

var mongoose = require('mongoose'),
    User = mongoose.model('User');
exports.render = function (req, res) {


    User.find_byPhoneNumber("+393484650470", function (user) {
        user.statsCalculator().total().then(function(t){
            console.log(t,"ads");
        })

    })

    // Send some basic starting info to the view


};

exports.renderPost = function (req, res) {
    console.log(req.body);
    res.jsonp(req.body);
    // Send some basic starting info to the view


};
