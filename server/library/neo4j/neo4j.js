var neo4j = require('node-neo4j');
var db = new neo4j('http://localhost:7474');
var _ = require('lodash');
var Q = require('q');

exports.countLevels = function (from, to) {
    var deferred = Q.defer();
    db.cypherQuery('START n1=node:users (name = "' + from + '"), n2=node:users (name = "' + to + '")' +
        'match sp=shortestPath((n1)-[*]->(n2))' +
        'RETURN length(sp) ', function (err, result) {
        if (err) throw err;

        var nLevels = result.data.length && result.data[0];
        deferred.resolve(nLevels);
    });
    return deferred.promise
};

exports.inContactsOf = function (from) {
    var deferred = Q.defer();
    db.cypherQuery('START n1=node:users (name = "' + from + '")' +
        'MATCH ((n1)-->(n2))' +
        'RETURN n2', function (err, result) {
        if (err) throw err;

        var contacts = result.data.length && result.data;
        deferred.resolve(contacts);
    });
    return deferred.promise;
};


/*
 *
 START s=node:users (name = "n1"), p=node:users (name = "n1000")
 match s-[:HAS]->x,p
 with x,p
 match paths=shortestPath(x-[*]->p)
 return NODES(paths)

 START s=node:users (name = "n95"), p=node:users (name = "n200")
 match s-[:HAS]->x,p
 with x,p
 match paths=shortestPath(x-[*]->p)
 return NODES(paths)[1],NODES(paths)[2], length(paths)
 ORDER BY length(paths) ASC

 START s=node:users (name = "n2"), p=node:users (name = "n20")
 match s-[:HAS]->x,p
 with x,p
 match paths=shortestPath(x-[*..3]->p)
 return NODES(paths)[1],NODES(paths)[2], length(paths)
 ORDER BY length(paths) ASC
 * */
/**
 *
 * @param from
 * @param to
 * @param success
 * @deprecated
 */
exports.contactsThatCanReachOld = function (from, to, success) {
    console.time("contactsThatCanReachOld");
    exports.inContactsOf(from, function (contacts) {
        var nSucceed = 0, contactsPossible = [];
        exports.countLevels(from, to, function (nLevelOriginal) {
            contacts.forEach(function (contact) {

                exports.countLevels(contact.name, to, function (nLevel) {
                    nSucceed++;
                    if (nLevel > 0 && nLevel < nLevelOriginal + 2) {
                        contactsPossible.push(contact.name);
                    }
                    console.log(nSucceed + "/" + contacts.length)
                    if (nSucceed > contacts.length - 5) {
                        console.log("What the fuck" + contactsPossible.length);
                        console.timeEnd("contactsThatCanReachOld");

                        success(contactsPossible);

                    }
                });
            });
        });
    });

};

exports.contactsThatCanReach = function (from, to) {
    console.time("contactsThatCanReach");
    var deferred = Q.defer();

    exports.countLevels(from, to)
        .then(function (nLevelOriginal) {
            var deferred = Q.defer();
            db.cypherQuery('START s=node:users (name = "' + from + '"), p=node:users (name = "' + to + '") ' +
                'match s-[:HAS]->x,p ' +
                'with x,p ' +
                '    match paths=shortestPath(x-[*..' + (nLevelOriginal + 2) + ']->p) ' +
                'return NODES(paths)[1] as name,NODES(paths)[2], length(paths) as dist ' +
                'ORDER BY length(paths) ASC', deferred.resolve);
            return deferred.promise;
        })
        .then(function (err, result) {
            if (err) throw err;
            console.timeEnd("contactsThatCanReach");

            var response = [];
            result.data.forEach(function (v) {
                response.push({
                    phoneHash: v[0].name,
                    dist: v[2]
                });
            });
            deferred.resolve(response);
        });

    return deferred.promise;
};

exports.addNode = function (phoneNumber) {
    var deferred = Q.defer();

    db.insertNode({
        name: "n" + phoneNumber
    }, function (err, node) {
        if (err) throw err;

        deferred.resolve(node._id, node.data);
    });
    return deferred.promise;
};


exports.addRel = function (from, to) {
    var deferred = Q.defer();

    db.insertRelationship(from, to, 'HAS', function (err, relationship) {
        if (err) throw err;
        deferred.resolve(relationship.data);
    });
    return deferred.promise;
};

exports.getContacts = function (from) {
    var deferred = Q.defer();
    db.cypherQuery('START s=node:users (name = "' + from + '") ' +
        'match s-[:HAS]->x ' +
        'return x.name', function (err, relationships) {
        if (err) throw err;
        deferred.resolve(relationships.data);
        console.log(relationships.data); // delivers an array of relationship objects.
    });
    return deferred.promise;
};

