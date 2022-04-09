const {basicAuth} = require('./auth');


function applyMiddlewares(app) {
   // add basic auth middleware
    app.use(basicAuth);
}

module.exports = {
    applyMiddlewares
};