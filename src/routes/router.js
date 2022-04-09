const sourceUrlService = require('../main/sourceUrlService');
const scrapedUrlService = require('../main/scrapedUrlService');

function addRoutes(app) {
    app.get('/health', (req, res) => {
        res.json({ status: 'ok' });
    });

    app.post('/scrape', async (req, res) => {
        res.send(sourceUrlService.add(req.body));
    });

    app.get('/scrape', async (req, res) => {
        const result = await sourceUrlService.get();
        res.json(result);
    });

    app.get('/assets', async (req, res) => {
        const result = await scrapedUrlService.get(req.query);
        res.json(result);
    });
}

module.exports = {
    addRoutes,
};
