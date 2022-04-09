const express = require('express');
const { addRoutes } = require('./src/routes/router');
const sourceUrlService = require('./src/main/sourceUrlService');
const {applyMiddlewares} = require('./src/middlewares')

global.Promise = require('bluebird');

const app = express();

app.use(express.json());
app.use(express.urlencoded());

const port = 2222;

addRoutes(app);
applyMiddlewares(app);

sourceUrlService.startAsyncScraping();

app.listen(port, () => {
    console.log('server running');
});
