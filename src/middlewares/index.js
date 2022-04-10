const {basicAuth} = require('./auth');
const {logger} = require('./logger');
const cors = require('cors');
const { errorMiddleware } = require('./error');


function applyMiddlewares(app) {
   // add basic auth middleware
    app.use(cors());
    app.use(basicAuth);
    app.use(logger);
}

function lateMiddlewares(app) {
    app.use(errorMiddleware);
}

module.exports = {
    applyMiddlewares,
    lateMiddlewares
};