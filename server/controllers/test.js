'use strict';

var mean = require('meanio');
var neo4j = require(__base + 'library/neo4j/neo4j');
var Q = require('q')

var mongoose = require('mongoose'),
    User = mongoose.model('User');
exports.render = function (req, res) {


    console.log(req.body);
    res.jsonp(req.body);
    // Send some basic starting info to the view


};

exports.renderPost = function (req, res) {


    console.log(req.body);
    res.jsonp(req.body);
    // Send some basic starting info to the view


};
