const utils = require('./utils');
const dbService = require('./dbService');
const { TABLE_NAMES, SCRAPED_URLS_TABLE, SOURCE_URLS_TABLE } = require('./dbTables');

async function get(params) {
    // extract the pagination params
    const { resultsPerPage = 20, pageNumber = 1 } = params;

    // find the filter params
    const { type, searchString } = params;

    const filters = [];
    const queryParams = [];
    if (type) {
        filters.push(
            `${TABLE_NAMES.SCRAPED_URLS}.${SCRAPED_URLS_TABLE.TYPE} = $${
                queryParams.length + 1
            }`
        );
        queryParams.push(utils.escapeSQLWildcards(type));
    }

    if (searchString) {
        filters.push(`(${TABLE_NAMES.SOURCE_URLS}.${SOURCE_URLS_TABLE.URL} ilike $${
            queryParams.length + 1
        } OR 
            ${TABLE_NAMES.SCRAPED_URLS}.${SOURCE_URLS_TABLE.URL} ilike $${
            queryParams.length + 1
        }
        )`);
        queryParams.push(`%${utils.escapeSQLWildcards(searchString)}%`);
    }

    const selectStatement = `
        SELECT 
            ${TABLE_NAMES.SCRAPED_URLS}.*, 
            ${TABLE_NAMES.SOURCE_URLS}.${SOURCE_URLS_TABLE.URL} as "source_url"  
        FROM ${TABLE_NAMES.SCRAPED_URLS}
        INNER JOIN ${TABLE_NAMES.SOURCE_URLS} ON
            ${TABLE_NAMES.SCRAPED_URLS}.${SCRAPED_URLS_TABLE.SOURCE_URL_ID} = ${
        TABLE_NAMES.SOURCE_URLS
    }.${SOURCE_URLS_TABLE.ID}
        ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''} 
        LIMIT ${resultsPerPage}
        OFFSET ${(pageNumber - 1) * resultsPerPage}
    `;
    return dbService.runQuery(selectStatement, queryParams);
}

async function add(msgBody, dbClient) {
    const columns = [
        SCRAPED_URLS_TABLE.URL,
        SCRAPED_URLS_TABLE.TYPE,
        SCRAPED_URLS_TABLE.SOURCE_URL_ID,
    ];

    const insertStm = dbService.createInsertStatement(
        TABLE_NAMES.SCRAPED_URLS,
        columns,
        msgBody
    );

    return dbService.runQuery(insertStm, msgBody.flat(), dbClient);
}

module.exports = {
    get,
    add,
};
