const puppeteer = require('puppeteer');

async function _scraper(browser, scrapingUrl) {
    const page = await browser.newPage();
    await page.goto(scrapingUrl);

    const scrapingResult = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'), ({ src,alt }) => {return {src,alt} });
        const videos = Array.from(
            document.querySelectorAll('video'),
            ({ src,alt }) => {return {src,alt} }
        );

        return {
            images: images.filter(({src}) => !src.includes('gif')),
            videos,
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
                    result: scrapingResult,
                };
            } catch (err) {
                return {
                    id,
                    url,
                    status: 'failed',
                    error: err,
                };
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
