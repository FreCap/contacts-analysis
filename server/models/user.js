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
        peopleReachable: {
            countStep1: Number,
            countStep2: Number,
            countStep3: Number,
            lastChange: Date
        },
        peopleReachMe: {
            countStep1: Number,
            countStep2: Number,
            countStep3: Number,
            lastChange: Date
        }
    }
});


UserSchema.plugin(textSearch);
UserSchema.index(
    { tags: 'text' }
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
                    console.log("11111111111111111111");
                    console.log(user);
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
    fetchContacts: function () {
        var user = this;

        return neo4j.getContacts(user.phoneNumber);
    },
    addToNeo: function () {
        var user = this;
        return  neo4j.addNode(user.phoneNumber)
            .then(function () {
                console.log("aggiunto nodo " + user.phoneNumber + " a neo4j");

                ContactNotExist.find_byPhoneNumber(user.phoneNumber, function (contactNotExist) {
                        if (!contactNotExist)
                            return true;
                        contactNotExist.forEach(function (v) {
                            v.inContactsOf.phoneNumber
                            neo4j.addRel(user.phoneNumber, v.inContactsOf.phoneNumber);
                        });
                        contactNotExist.remove();
                        // TODO Aggiungere sistema di notifica a tutti quelli che lo avevano in rubrica
                        // TODO Aggiunere sistema di notifica
                    },
                    function () {
                        console.error("ERROR");
                    });
                return true;
            })
    },
    // ################### CONTACTS ###################
    /*
     * contact: {phoneNumber:String,name:String}
     */
    addContact: function (contact, success) {
        var user = this;
        return Q({})
            .then(function () {
                var deferred = Q.defer()
                UserSchema.statics.find_byPhoneNumber(contact.phoneNumber, deferred.resolve);
                return deferred.promise;
            }).then(function (contactExist) {
                if (contactExist == null) {
                    // se non è un utente registrato, creo un "contactNotExist"
                    //TODO aggiungere il name
                    ContactNotExist.create(contact.phoneNumber, user, contact.name)
                } else {
                    // sennò creo la struttura in neo4j
                    neo4j.addRel(user.phoneNumber, contactExist.phoneNumber).
                        then(success);
                    //TODO notifica push all'utente
                }
            })

    },
    // [{phoneNumber:String, OTHER},..]
    mergeContacts: function (newContacts) {
        var user = this;
        var contactsToDelete = [];
        this.fetchContacts()
            .then(function (currentContacts) {
                // controllo gli utenti che c'erano e adesso non ci son più
                currentContacts.forEach(function (v) {
                    var exist = newContacts.indexOf(v);
                    if (exist == -1)
                        contactsToDelete.push(v);
                });
                newContacts.forEach(function (v) {
                    var exist = currentContacts.indexOf(v.phoneNumber);
                    if (exist > -1) {
                        // eventualmente da aggiornare
                    } else {
                        // da aggiungere
                        user.addContact(v);
                    }
                });
            });
    },
    distance: function (to) {
        return neo4j.countLevels(to);
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


User = mongoose.model('User', UserSchema);
