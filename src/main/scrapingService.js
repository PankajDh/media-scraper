const puppeteer = require('puppeteer');

async function _scraper(browser, scrapingUrl) {
    const page = await browser.newPage();
    await page.goto(scrapingUrl);

    const scrapingResult = await page.evaluate(() => {
        const imageUrls = Array.from(
            document.querySelectorAll('img'),
            ({ src }) => src
        );
        const videoUrls = Array.from(
            document.querySelectorAll('video'),
            ({ src }) => src
        );

        return {
            imageUrls: imageUrls.filter(e => !e.includes('gif')),
            videoUrls,
        };
    });

    return scrapingResult;
}

async function scrape(sourceUrlObjects) {
    const browser = await puppeteer.launch();

    const result = await Promise.map(
        sourceUrlObjects,
        async ({ id, url }) => {
            try {
                const scrapingResult = await _scraper(browser, url);
                return {
                    id,
                    url,
                    status: 'success',
                    result : scrapingResult
                 
                };
            } catch(err) {
                return {
                    id,
                    url,
                    status: 'failed',
                    error: err
                }
            }
        },
        { concurrency: 5 }
    );
    await browser.close();

    return result;
}

module.exports = {
    scrape,
};
