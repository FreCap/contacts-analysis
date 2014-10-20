'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    crypto = require('crypto'),
    _ = require('lodash'),
    Q = require('q'),
    buffertools = require('buffertools'),
    textSearch = require('mongoose-text-search');
var neo4j = require(__base + 'library/neo4j/neo4j');
var ContactNotExist = mongoose.model('ContactNotExist');
var Contact = mongoose.model('Contact');
var Stats = mongoose.model('Stats');
var mathjs = require('mathjs'),
    math = mathjs();

var User, UserSchema;

/**
 * User Schema
 */
UserSchema = new Schema({
    phoneNumber: {
        type: String,
        required: true,
        unique: true
    },
    phoneHash: {
        type: String,
        unique: true
    },
    nodeId: Number,
    email: String,
    token: String,
    password: {
        hash: Buffer,
        salt: Buffer,
        iterations: Number,
        changed: Date,
        updated: Date
    },
    roles: [String],
    photo: String,
    tags: [String],
    personal: {
        fullname: String,
        name: String,
        surname: String,
        city: String
    },
    providers: {},
    stats: {
        ranks: {
            computed: {
                averageContactsIndex: Number,
                wanted: Number,
                power: Number,
                popularity: Number,
                fancy: Number,
                total: Number,
                lastUpdate: Date
            },
            searched: Number,
            peopleReachable: {
                countStep1: Number,
                countStep2: Number,
                lastUpdate: Date
            },
            peopleReachMe: {
                countStep1: Number,
                countStep2: Number,
                lastUpdate: Date
            }
        },
        computed: {
            averageContactsIndex: Number,
            wanted: Number,
            power: Number,
            popularity: Number,
            fancy: Number,
            total: Number,
            lastUpdate: Date
        },
        searched: Number,
        peopleReachable: {
            countStep1: Number,
            countStep2: Number,
            lastUpdate: Date
        },
        peopleReachMe: {
            countStep1: Number,
            countStep2: Number,
            lastUpdate: Date
        }
    }
});


UserSchema.plugin(textSearch);
UserSchema.index(
    { tags: 'text', "personal.name": 'text', "personal.surname": 'text', "personal.city": 'text' }
);


/**
 * Constants
 */
UserSchema.statics.PW_SALT_LENGTH = 16;
UserSchema.statics.PW_KEYLENGTH = 64;
UserSchema.statics.PW_ITERATIONS = 10000;


/**
 * Validations
 */
UserSchema.pre('save', function (next) {
    var hasSocialAuth = !_.isEmpty(this.providers),
        hasLocalAuth = this.password.hash && this.password.hash.length;

    if (!hasSocialAuth && !hasLocalAuth) {
        next(new Error('Authorization missing: needs password or social auth'));
    } else {
        next();
    }
});


UserSchema.pre('remove', function (next) {
    var user = this;
    neo4j.removeNode(this.nodeId)
        .then(function () {
            return ContactNotExist.remove_byUser(user)
        })
        .then(function () {
            return Contact.remove_byUser(user)
        })
        .then(function () {
            return Stats.remove_byUser(user)
        })
        .then(function () {
            next();
        });
});

/**
 * Make random salt
 *
 * @returns {Promise.<Buffer,Error>}
 */
function makeSalt(plaintext) {
    return Q.nfcall(crypto.randomBytes, User.PW_SALT_LENGTH)
}

/**
 * Hash password
 *
 * @param {string} plaintext
 * @param {Buffer} salt
 * @param {number} iterations
 * @param {number} keylen
 * @returns {Promise.<Buffer,Error>}
 */
var hashPassword = Q.denodeify(crypto.pbkdf2);

/**
 * New password salting and hashing
 *
 * @param {string} plaintext
 * @returns {Promise.<object,Error>} password info object
 */
function newPassword(plaintext) {
    return Q({})
        .then(function (password) {
            // make salt
            return makeSalt()
                .then(function (salt) {
                    password.salt = salt;
                    return password;
                });
        })
        .then(function (password) {
            // hash with pbkdf2
            return hashPassword(plaintext, password.salt, User.PW_ITERATIONS, User.PW_KEYLENGTH)
                .then(function (hash) {
                    password.hash = hash;
                    password.iterations = User.PW_ITERATIONS;
                    return password;
                });
        });
}

/**
 * check if password is up to date or needs rehash
 *
 * @param {object} passwordInfo
 * @returns {boolean}
 */
function passwordNeedsRehash(passwordInfo) {
    return passwordInfo.iterations !== User.PW_ITERATIONS ||
        passwordInfo.hash.length !== User.PW_KEYLENGTH ||
        passwordInfo.salt.length !== User.PW_SALT_LENGTH;
}

var popIndexAggregate = function (nodesId, sommatoriaOf) {
    var deferred = Q.defer();
    User.aggregate([
        {"$match": {nodeId: {$in: nodesId}}},
        {
            "$group": {
                "_id": null,
                "total": {
                    "$sum": sommatoriaOf
                }
            }
        }
    ], deferred.makeNodeResolver());
    return deferred.promise;
};

var RANK_ORDER_GREATER = 1;
var RANK_ORDER_LESSER = 2;

var rankPosition = function (nodesId, parameter, value, order) {
    var deferred = Q.defer();
    var query = User.in(nodesId);
    if (order == RANK_ORDER_GREATER)
        query = query.where(parameter, { qty: { $gt: value } });
    else
        query = query.where(parameter, { qty: { $lt: value } });
    query.count(deferred.makeNodeResolver());
    return deferred.promise;
};

var topOfNodes = function (nodesId, parameter) {
    // es parameter = "stats.peopleReachable.countStep2"
    var deferred = Q.defer();
    User.aggregate([
        {"$match": {nodeId: {$in: nodesId}}},
        { $sort: {parameter: 1 } },
        { $limit: 5 }
    ], deferred.makeNodeResolver());
    return deferred.promise;
};

var averageOfNodes = function (nodesId, parameter) {
    // es parameter = "$stats.computed.total"
    var deferred = Q.defer();
    User.aggregate([
        {"$match": {nodeId: {$in: nodesId}}},
        { $group: {
            _id: null,
            avg: { $avg: '$' + parameter }
        }}
    ], function (err, avg) {
        if (err)deferred.reject(new Error(err));
        deferred.resolve(avg[0].avg)
    });
    return deferred.promise;
};

/**
 * Instance methods
 */
UserSchema.methods = {
    /**
     * eenticate
     * verify password and maybe update hash
     *
     * @param {String} plaintext
     * @return {Promise.<boolean,Error>}
     * @api public
     */
    authenticate: function (plaintext) {
        var user = this;

        return this.verifyPassword(plaintext)
            .then(function (verified) {
                // rehash if needed
                if (verified) {
                    user.token = require('crypto').randomBytes(32).toString('hex');
                    user.save();
                }
                if (verified && passwordNeedsRehash(user.password)) {
                    return newPassword(plaintext)
                        .then(function (password) {
                            password.updated = Date.now();
                            password.changed = user.password.changed;
                            user.password = password;
                        })
                        .then(verified);
                }
                return verified;
            });

    },

    /**
     * Verify password
     *
     * @param {String} plaintext
     * @return {Promise.<boolean,Error>}
     * @api public
     */
    verifyPassword: function (plaintext) {
        var password = this.password;

        if (!password.hash) return Q(false);

        return hashPassword(plaintext, password.salt, password.iterations, password.hash.length)
            .then(function (hash) {
                return buffertools.equals(hash, password.hash);
            });
    },

    /**
     * Set Password
     *
     * @param {String} plaintext
     * @return {Promise.<undefined,Error>}
     * @api public
     */
    setPassword: function (plaintext) {
        var user = this;

        if (typeof plaintext !== 'string') return Q(new Error('Password is not a string'));

        return newPassword(plaintext)
            .then(function (password) {
                password.updated = password.changed = Date.now();
                user.password = password;
            });
    },
    // ################### CONTACTS ###################
    fetchContactsNames: function () {
        var user = this;
        return neo4j.getContactsNames(user.nodeId);
    },
    fetchContactsNodeId: function () {
        var user = this;
        return neo4j.getContactsNodeId(user.nodeId);
    },
    addToNeo: function () {
        var user = this;
        return  neo4j.addNode(user.phoneNumber)
            .then(function (node_id, node_data) {
                user.nodeId = node_id;

//                console.log("aggiunto nodo " + user.phoneNumber + " a neo4j");

                ContactNotExist.find_byPhoneNumber(user.phoneNumber, function (contactNotExist) {
                        if (!contactNotExist)
                            return true;
                        contactNotExist.forEach(function (v) {
                            if (!v)
                                return true;
                            neo4j.addRel(user.nodeId, v.inContactsOf.nodeId);
                            v.remove();
                        });
                        // TODO Aggiungere sistema di notifica a tutti quelli che lo avevano in rubrica
                        // TODO Aggiunere sistema di notifica
                    },
                    function () {
                        console.error("ERROR");
                    });
                return Q.ninvoke(user, 'save');
            })
    },
    // ################### CONTACTS ###################
    /*
     * contact: {phoneNumber:String,name:String}
     */
    addContact: function (contact) {
        var user = this;
        var deferred = Q.defer();
        return Q({})
            .then(function () {
                var deferred = Q.defer()
                UserSchema.statics.find_byPhoneNumber(contact.phoneNumber, deferred.resolve);
                return deferred.promise;
            }).then(function (contactExist) {
                Contact.create(contact.phoneNumber, user, contact.name)
                if (contactExist == null) {
                    // se non è un utente registrato, creo un "contactNotExist"
                    //TODO aggiungere il name
                    ContactNotExist.create(contact.phoneNumber, user, contact.name)
                } else {
                    // sennò creo la struttura in neo4j
                    return Q.fcall(neo4j.addRel, user.nodeId, contactExist.nodeId);
                    //TODO notifica push all'utente
                }
            })

    },
    // [{phoneNumber:String, OTHER},..]
    mergeContacts: function (newContacts) {
        var deferred = Q.defer()
        var user = this;
        var contactsToDelete = [];
        this.fetchContactsNames()
            .then(function (currentContacts) {
                // controllo gli utenti che c'erano e adesso non ci son più
                currentContacts.forEach(function (v) {
                    var exist = newContacts.indexOf(v);
                    if (exist == -1)
                        contactsToDelete.push(v);
                });
                Contact.remove_byUser(user);
                var addContactQueue = [];
                newContacts.forEach(function (v) {
                    var exist = currentContacts.indexOf(v.phoneNumber);
                    if (exist > -1) {
                        Contact.create(v.phoneNumber, user, v.name)
                        // eventualmente da aggiornare

                    } else {
                        // da aggiungere
                        addContactQueue.push(user.addContact(v));
                    }
                });
                Q.all(addContactQueue)
                    .then(function () {
                        return user.updateInContactsStats();
                    })
                    .then(deferred.resolve);

            });
        return deferred.promise;
    },
    updateInContactsStats: function () {
        var user = this;
        return Q.all([neo4j.peopleReachable(user.nodeId)
            .spread(function (level1, level2) {
                user.stats.peopleReachable.countStep1 = level1.length;
                user.stats.peopleReachable.countStep2 = level2.length;
            })
            , neo4j.peopleReachMe(user.nodeId)
                .spread(function (level1, level2) {
                    user.stats.peopleReachMe.countStep1 = level1.length;
                    user.stats.peopleReachMe.countStep2 = level2.length;

                })
        ]).then(function () {
            return Q.ninvoke(user, "save");
        });
    },
    distance: function (to) {
        return neo4j.countLevels(this.nodeId, to.nodeId);
    },
    popIndex: function () {
        // @DEPRECATED
        return neo4j.countPeopleReachMe(this.nodeId)
            .then(function (values) {
                return math.pow(values[0], 2)
                    + math.pow(values[1], 1.5)
                    + math.pow(values[2], 1)
                    + math.pow(values[3], 0.6);
            });
    },
    statsGet: function () {
        var user = this,
            computed = user.stats.computed;
        return {
            averageContactsIndex : computed.averageContactsIndex ? computed.averageContactsIndex : 0,
            wanted: computed.wanted ? computed.wanted : 0,
            power: computed.power ? computed.power : 0,
            popularity: computed.popularity ? computed.popularity : 0,
            fancy: computed.wanted ? computed.fancy : 0,
            total: computed.total ? computed.total : 0
        }
    },
    statsCalculator: function () {
        var user = this;
        return {
            averageContactsIndex: function () {
                return user.fetchContactsNodeId()
                    .then(function (nodesId) {
                        return averageOfNodes(nodesId, "stats.computed.total")
                    }).
                    then(function (average) {
                        user.stats.computed.averageContactsIndex = parseInt(average);
                        return Q.ninvoke(user, "save");
                    }) .then(function () {
                        return user.stats.computed.averageContactsIndex;
                    });
            },
            wanted: function () {
                //quando mi cercano

                return Q(user.stats.searched);
            },
            power: function () {
                //POWER(N):= Sommatoria (NU1_i * R(NU1_i)) + RadiceQuadtrata (Sommatoria (NU2_i * R(NU2_i)))
                return neo4j.peopleReachable(user.nodeId)
                    .spread(function (level1, level2) {
                        user.stats.peopleReachable.countStep1 = level1.length;
                        user.stats.peopleReachable.countStep2 = level2.length;
                        console.log("all done")
                        return Q.all([
                            popIndexAggregate(level1.toArray(),
                                {"$multiply": ["$stats.peopleReachable.countStep1"
                                    , {"$add": [1,
                                        {"$ifNull": [ "$stats.searched", 0]}
                                    ]}
                                ]}),
                            popIndexAggregate(level2.toArray(),
                                {"$multiply": ["$stats.peopleReachable.countStep2"
                                    , {"$add": [1,
                                        {"$ifNull": [ "$stats.searched", 0]}
                                    ]}
                                ]})
                        ]).spread(function (level1Options, level2Options) {
                            var level1Index = level1Options.length ? level1Options[0].total : 0,
                                level2Index = level2Options.length ? level2Options[0].total : 0;

                            user.stats.computed.power = level1Index + math.sqrt(level2Index);
                            return Q.ninvoke(user, "save");
                        }).then(function () {
                            return user.stats.computed.power;
                        });
                    });
            },
            popularity: function () {
                //POPULARITY(N):= Sommatoria (NE1_i) + RadiceQuadtrata (Sommatoria (NE2_i ))
                return neo4j.peopleReachMe(user.nodeId)
                    .spread(function (level1, level2) {
                        user.stats.peopleReachMe.countStep1 = level1.length;
                        user.stats.peopleReachMe.countStep2 = level2.length;
                        return Q.all([
                            popIndexAggregate(level1.toArray(),
                                "$stats.peopleReachMe.countStep1"),
                            popIndexAggregate(level2.toArray(),
                                "$stats.peopleReachMe.countStep2")

                        ]).spread(function (level1Options, level2Options) {
                            var level1Index = level1Options.length ? level1Options[0].total : 0,
                                level2Index = level2Options.length ? level2Options[0].total : 0;
                            user.stats.computed.popularity = level1Index + math.sqrt(level2Index);
                            return Q.ninvoke(user, "save")
                                .then(function () {
                                    return user.stats.computed.popularity;
                                });
                        });
                    });
            },
            fancy: function () {
                //FANCY(N):= WANTED(N) / POPULARITY(N)
                if (user.statsGet().popularity == 0)
                    user.stats.computed.fancy = 0;
                else
                    user.stats.computed.fancy = math.pow(user.statsGet().wanted, 3) / user.statsGet().popularity;
                return Q.ninvoke(user, "save")
                    .then(function () {
                        return user.stats.computed.fancy;
                    });
            },
            total: function () {
                //RI(N) = WANTED(N) + POWER(N) +POPULARITY(N)+FANCY(N)
                return Q.all([
                    user.statsCalculator().wanted(),
                    user.statsCalculator().power(),
                    user.statsCalculator().popularity(),
                    user.statsCalculator().fancy()
                ]).then(function () {
                    user.stats.computed.total = user.statsGet().wanted
                        + user.statsGet().power
                        + user.statsGet().popularity
                        + user.statsGet().fancy;
                    user.stats.computed.lastUpdate = Date.now();
                    console.log(user.stats);
                    var stats = new Stats({
                        stats: JSON.parse(JSON.stringify(user.stats)),
                        user: user
                    })
                    console.log(stats);
                    return Q.ninvoke(user, "save").
                        then(function () {
                            return Q.ninvoke(stats, "save");
                        })
                        .then(function () {
                            return user.stats.computed.total;
                        });
                });
            }
        }
    }
};


UserSchema.statics.find_byPhoneNumber = function (phoneNumber, callback, callbackError) {
    User.findOne({
        phoneNumber: phoneNumber
    }, function (err, contact) {
        if (err) {
            callbackError(err);
        } else {
            callback(contact);
        }
    })
};

UserSchema.statics.find_byName = function (name) {
    var deferred = Q.defer();
    User.textSearch(name, deferred.makeNodeResolver());
    return deferred.promise;
};

UserSchema.statics.find_byStatslastUpdated = function () {
    var deferred = Q.defer();
    this.find()
        .sort({"stats.compute.lastUpdate": 'asc'})
        .limit(20)
        .exec(function (err, users) {
            if (err)
                return err;
            return deferred.resolve(users);
        });

    return deferred.promise;
};

User = mongoose.model('User', UserSchema);
