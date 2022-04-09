const utils = require('./utils');
const dbService = require('./dbService');
const scrapingService = require('./scrapingService');
const scrapedUrlService = require('./scrapedUrlService');
const { TABLE_NAMES } = require('./dbTables');

/**
 * @summary adds the web urls for which we need to do the scrapping
 * @param {webUrls: string[]} msgBody
 * @returns void
 */ 
async function add(msgBody) {
    const { webUrls } = msgBody;

    const urlsAlreadyPresent = (await get({ url: webUrls })).map(
        ({ url }) => url
    );
    const uniqueUrls = webUrls.filter(
        (val) => !urlsAlreadyPresent.includes(val)
    );

    const sanitizedUrls = uniqueUrls.map(utils.escapeSQLWildcards);
    const insertStatement = dbService.createInsertStatement(
        TABLE_NAMES.SOURCE_URLS,
        ['url'],
        sanitizedUrls.map((e) => [e])
    );

    return dbService.runQuery(insertStatement, sanitizedUrls);
}

async function get(filters, limit, offset, orderBy) {
    const { queryString, queryParams } = dbService.createSelectStatement(
        TABLE_NAMES.SOURCE_URLS,
        [],
        filters,
        limit,
        offset,
        orderBy
    );
    return dbService.runQuery(queryString, queryParams);
}

async function _findUnscrapedUrls(dbClient) {
    const selectStm = `
            Select * FROM ${TABLE_NAMES.SOURCE_URLS}
            WHERE is_scraped = $1 and retries < $2 FOR UPDATE LIMIT $3
        `;

    return dbService.runQuery(selectStm, [false, 3, 5], dbClient);
}

async function _updatedSuccessFulScraping(scrapingResult, dbClient) {
    const successResults = scrapingResult.filter(({status}) => status === 'success');
    const updateSuccessStm = `
            UPDATE ${TABLE_NAMES.SOURCE_URLS} SET is_scraped = true where id in (${successResults.map((_, idx) => `$${idx + 1}`)})
        `;
    await dbService.runQuery(updateSuccessStm, successResults.map(({id})=> id), dbClient);

    const insertBody = successResults.map(({id, result}) => {
        const {imageUrls, videoUrls} = result;

        const sanitizedImageUrls= imageUrls.map(utils.escapeSQLWildcards)
        const sanitizedVideoUrls= videoUrls.map(utils.escapeSQLWildcards)
        return [
            ...sanitizedImageUrls.filter((eachImageUrl) => eachImageUrl !== '').map((eachImageUrl) => [eachImageUrl, 'image', id]),
            ...sanitizedVideoUrls.filter((eachVideoUrl) => eachVideoUrl !== '').map((eachVideoUrl) => [eachVideoUrl, 'video', id])
        ];
    });
    await scrapedUrlService.add(insertBody.flat(),dbClient)
}

async function _updatedFailedScraping(scrapingResult, dbClient) {
    const failedResults = scrapingResult.filter(({status}) => status === 'failed');
    
    if (!failedResults.length) {
        return;
    }

    const updateFailedStm = `
        UPDATE ${TABLE_NAMES.SOURCE_URLS} SET is_scraped = false, retries=retries + 1 where id in (${failedResults.map((_, idx) => `$${idx + 1}`)})
    `;
    await dbService.runQuery(updateFailedStm, failedResults.map(({id})=> id), dbClient);
}

async function scrapeSourceUrl() {
    let dbClient;
    try {
        dbClient = await dbService.getConnection();
        await dbService.runQuery('BEGIN', [], dbClient);
        
        const unScrapedUrls = await _findUnscrapedUrls(dbClient);
        if (!unScrapedUrls.length) {
            console.log('nothing to scrape returning');
            return false;
        }
        
        const scrapingResult = await scrapingService.scrape(unScrapedUrls);

        await _updatedSuccessFulScraping(scrapingResult, dbClient);
        await _updatedFailedScraping(scrapingResult, dbClient);

        await dbService.runQuery('COMMIT', [], dbClient); 
        return true
    } catch(err) {
        if(dbClient) {
            await dbService.runQuery('ROLLBACK', [], dbClient);
            await dbClient.release();
        }
       throw err;
    }
}

async function startAsyncScraping() {
    setTimeout(async ()=>{
        const needFurtherScraping = await scrapeSourceUrl();
        const nextTimeout = needFurtherScraping ? 0 : 10000;
        setTimeout(() => startAsyncScraping(), nextTimeout);
    });
}

module.exports = {
    add,
    get,
    scrapeSourceUrl,
    startAsyncScraping
};
