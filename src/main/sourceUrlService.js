const utils = require('./utils');
const dbService = require('./dbService');
const scrapingService = require('./scrapingService');
const scrapedUrlService = require('./scrapedUrlService');
const { TABLE_NAMES, SOURCE_URLS_TABLE } = require('./dbTables');

/**
 * @summary adds the web urls for which we need to do the scrapping
 * @param {webUrls: string[]} msgBody
 * @returns void
 */
async function add(msgBody) {
    const { webUrls } = msgBody;

    
    const urlsAlreadyPresent = (await _getByUrls(webUrls)).map(({ url }) => url);
    const uniqueUrls = webUrls.filter((val) => !urlsAlreadyPresent.includes(val));
    const sanitizedUrls = uniqueUrls.filter((e)=> e.includes('http')).map(utils.escapeSQLWildcards);
    
    const insertStatement = dbService.createInsertStatement(
        TABLE_NAMES.SOURCE_URLS,
        [SOURCE_URLS_TABLE.URL],
        sanitizedUrls.map((e) => [e])
    );

    await dbService.runQuery(insertStatement, sanitizedUrls);
    return {status : 'ok'};
}

async function _getByUrls(urls) {
    const sanitizedUrls = urls.map(utils.escapeSQLWildcards);
    const alreadyUrlStm = `
        Select 
            ${SOURCE_URLS_TABLE.URL} 
        FROM 
            ${TABLE_NAMES.SOURCE_URLS}
        WHERE
            ${SOURCE_URLS_TABLE.URL} IN (${sanitizedUrls.map((_, idx) => `$${idx + 1}`)})
    `;

    return dbService.runQuery(alreadyUrlStm, sanitizedUrls);
}

async function get(params) {
    const { resultsPerPage = 20, pageNumber = 1, searchString } = params;

    const filters = [];
    const queryParams = [];
    if (searchString) {
        filters.push(
            `(${TABLE_NAMES.SOURCE_URLS}.${SOURCE_URLS_TABLE.URL} ilike $${
                queryParams.length + 1
            })`
        );
        queryParams.push(`%${utils.escapeSQLWildcards(searchString)}%`);
    }

    const selectStatement = `
        SELECT 
            ${TABLE_NAMES.SOURCE_URLS}.*
        FROM ${TABLE_NAMES.SOURCE_URLS}
        ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''} 
        LIMIT ${resultsPerPage}
        OFFSET ${(pageNumber - 1) * resultsPerPage}
    `;
    const data = await dbService.runQuery(selectStatement, queryParams);

    const stmCount = `Select count(*) from ${TABLE_NAMES.SOURCE_URLS}  ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}`;
    const countResult = await dbService.runQuery(stmCount, queryParams);
    const totalItems = parseInt(countResult[0].count);

    return {
        data: utils.convertToCamelCaseObject(data),
        totalItems : totalItems,
        totalPage: Math.ceil(totalItems/resultsPerPage)
    }
}

async function _findUnscrapedUrls(dbClient) {
    const selectStm = `
            Select * FROM ${TABLE_NAMES.SOURCE_URLS}
            WHERE ${SOURCE_URLS_TABLE.IS_SCRAPED} = $1 and ${SOURCE_URLS_TABLE.RETRIES} < $2 FOR UPDATE LIMIT $3
        `;

    return dbService.runQuery(selectStm, [false, 3, 5], dbClient);
}

async function _updatedSuccessFulScraping(scrapingResult, dbClient) {
    const successResults = scrapingResult.filter(({ status }) => status === 'success');
    if (!successResults.length) {
        return;
    }
    const updateSuccessStm = `
            UPDATE 
                ${TABLE_NAMES.SOURCE_URLS} 
            SET ${SOURCE_URLS_TABLE.IS_SCRAPED } = true 
            WHERE ${SOURCE_URLS_TABLE.ID} in (${successResults.map((_, idx) => `$${idx + 1}`)})
        `;
    
    await dbService.runQuery(
        updateSuccessStm,
        successResults.map(({ id }) => id),
        dbClient
    );

    const insertBody = successResults.map(({ id, result }) => {
        const { images, videos } = result;

        return [
            ...images
                .filter(({src}) => src !== '')
                .map(({src, alt}) => [src,alt, 'image', id]),
            ...videos
                .filter(({src}) => src !== '')
                .map(({src, alt}) => [src,alt, 'video', id]),
        ];
    });
    await scrapedUrlService.add(insertBody.flat(), dbClient);
}

async function _updatedFailedScraping(scrapingResult, dbClient) {
    const failedResults = scrapingResult.filter(({ status }) => status === 'failed');

    if (!failedResults.length) {
        return;
    }

    const updateFailedStm = `
        UPDATE 
            ${TABLE_NAMES.SOURCE_URLS} 
        SET 
            ${SOURCE_URLS_TABLE.IS_SCRAPED} = false, 
            ${SOURCE_URLS_TABLE.RETRIES}=${SOURCE_URLS_TABLE.RETRIES} + 1 
        WHERE 
            ${SOURCE_URLS_TABLE.ID} in (${failedResults.map((_, idx) => `$${idx + 1}`)})
    `;

    await dbService.runQuery(
        updateFailedStm,
        failedResults.map(({ id }) => id),
        dbClient
    );
}

/**
 * @summary find urls to be scraped and scrape them
 * @returns void
 */
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
        await dbClient.release();
        return true;
    } catch (err) {
        if (dbClient) {
            await dbService.runQuery('ROLLBACK', [], dbClient);
            await dbClient.release();
        }
        throw err;
    }
}

/**
 * @summary schedule next scraping event
 */
async function startAsyncScraping() {
    setTimeout(async () => {
       try {
            const needFurtherScraping = await scrapeSourceUrl();
            const nextTimeout = needFurtherScraping ? 1000 : 20000;
            setTimeout(() => startAsyncScraping(), nextTimeout);
       } catch(err) {
           console.log(`error in the scraping process->\n ${err}`);
       }
    });
}

module.exports = {
    add,
    get,
    startAsyncScraping,
};
