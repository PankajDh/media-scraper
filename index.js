const express = require('express');
const { addRoutes } = require('./src/routes/router');
const sourceUrlService = require('./src/main/sourceUrlService');

global.Promise = require('bluebird');

const app = express();

app.use(express.json());
app.use(express.urlencoded());

const port = 2222;

addRoutes(app);

sourceUrlService.startAsyncScraping();

app.listen(port, () => {
    console.log('server running');
});
