const sourceUrlService = require('../main/sourceUrlService');
const scrapedUrlService = require('../main/scrapedUrlService');
const tryCatchWrapper = require('./tryCatchWrapper');

function addRoutes(app) {
    app.get('/health', (req, res) => {
        res.json({ status: 'ok' });
    });

    app.post('/scrape', async (req, res, next) => {
        try {
            const result = await sourceUrlService.add(req.body);
            res.send(result);
        } catch(err) {
            next(err);
        }
    });

    app.get('/scrape', async (req, res, next) => {
        try {
            const result = await sourceUrlService.get(req.query);
            res.json(result);
        } catch(err) {
            next(err);
        }
    });

    app.get('/assets', async (req, res, next) => {
        try {
            const result = await scrapedUrlService.get(req.query);
            res.json(result);
        } catch(err) {
            next(err);
        }
    });
}

module.exports = {
    addRoutes,
};
