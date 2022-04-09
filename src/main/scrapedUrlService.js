const utils = require('./utils');
const dbService = require('./dbService');
const { TABLE_NAMES } = require('./dbTables');

async function get(params) {
    // extract the pagination params
    const { resultsPerPage = 20, pageNumber = 1 } = params;

    // find the filter params
    const { type } = params;

    const filters = [];
    const queryParams = [];
    if (type) {
        filters.push(
            `${TABLE_NAMES.SCRAPED_URLS}.type = $${queryParams.length + 1}`
        );
        queryParams.push(utils.escapeSQLWildcards(type));
    }

    const selectStatement = `
        SELECT 
            ${TABLE_NAMES.SCRAPED_URLS}.*, 
            ${TABLE_NAMES.SOURCE_URLS}.url as "source_url"  
        FROM ${TABLE_NAMES.SCRAPED_URLS}
        INNER JOIN ${TABLE_NAMES.SOURCE_URLS} ON
            ${TABLE_NAMES.SCRAPED_URLS}.source_url_id = ${TABLE_NAMES.SOURCE_URLS}.id
        ${filters.length ? `${filters.join(' AND ')}` : ''} 
        LIMIT ${resultsPerPage}
        OFFSET ${(pageNumber - 1) * resultsPerPage}
    `;
    return dbService.runQuery(selectStatement, queryParams);
}

async function add(msgBody, dbClient) {
    // const { urls, type, sourceUrlId } = msgBody;

    const columns = ['url', 'type', 'source_url_id'];
    // const valuesToAdd = urls.map((eachUrl) => [eachUrl, type, sourceUrlId]);

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
