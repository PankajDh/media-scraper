const puppeteer = require('puppeteer');

/**
 * @summary find the src and alt of image and videos on the scrapingUrl
 * @param {puppeteer.Browser} browser 
 * @param {String} scrapingUrl 
 * @returns Array
 */
async function _scraper(browser, scrapingUrl) {
    const page = await browser.newPage();
    await page.goto(scrapingUrl);

    const scrapingResult = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'), ({ src,alt }) => {return {src,alt} });
        const videos = Array.from(
            Array.from(document.querySelectorAll('video')).map((e)=>e.querySelector('source')),
            ({ src,alt }) => {return {src,alt} }
        );

        return {
            images: images.filter(({src}) => !src.includes('gif') && src.startsWith('http')),
            videos: videos.filter(({src})=> !src.includes('blob') && src.startsWith('http')),
        };
    });

    return scrapingResult;
}

/**
 * @summary scrape multiple urls concurrently
 * @param {Object} sourceUrlObjects 
 * @returns Array
 */
async function scrape(sourceUrlObjects) {
    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
    
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
    } catch(err) {
        if(browser) {
            await browser.close();
        }
        return sourceUrlObjects.map(({id, url})=>{
            return {
                id,
                url,
                status: 'failed',
                error: err,
            };
        })
    }
    
}

module.exports = {
    scrape,
};
