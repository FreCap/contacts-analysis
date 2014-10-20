'use strict';

module.exports = function(app) {

    // Home route
    var test = require('../controllers/test');

    app.route('/test')
        .get(test.render);
    app.route('/test')
        .post(test.renderPost);

};
