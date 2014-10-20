'use strict';

var mean = require('meanio');
var neo4j = require(__base + 'library/neo4j/neo4j');
var Q = require('q')

var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Stats = mongoose.model('Stats'),
    cUtils =  require(__base + 'library/cUtils');

exports.render = function (req, res) {
console.log(cUtils);
    console.log(cUtils.descendants({rank:{s:"asd",g:"asd"}, b:2, c:"asda",y:{q:['1']}}, 'rank'));
//    Q.ninvoke(User, "findOne", {nodeId:54}).then(function (user) {
//        Q.ninvoke(User, "findOne", {nodeId:54}).then(function (user) {
//            user.statsCalculator().averageContactsIndex().then(function(a){
//                console.log(a);
//            });
//        })
//    })

//    User.find_byStatslastUpdated().then(function (users) {
//        console.log("ASDASDSAD")
//
//        users.forEach(function (a) {
//            console.log("1");
//
//            a.statsCalculator().total().then(function (b) {
//                console.log(b);
//            });
//        });
//    })

    //  user.statsCalculator().total()

    // Send some basic starting info to the view


};

exports.renderPost = function (req, res) {
    console.log(req.body);
    res.jsonp(req.body);
    // Send some basic starting info to the view


};
