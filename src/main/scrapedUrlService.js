const utils = require('./utils');
const dbService = require('./dbService');
const { TABLE_NAMES, SCRAPED_URLS_TABLE, SOURCE_URLS_TABLE } = require('./dbTables');


/**
 * @summary find paginated data for the scraped urls
 * @param {Object} params 
 * @returns arrray of scraped url objects
 */
async function get(params) {
    // extract the pagination params
    const { resultsPerPage = 20, pageNumber = 1 } = params;

    // find the filter params
    const { type, searchString } = params;

    const filters = [];
    const queryParams = [];
    
    if (type && !['video', 'image', 'all'].includes(type)) {
        throw utils.errorBuilder('Invalid value for asset type', 400);
    }

    if (type && type != 'all') {
        filters.push(
            `${TABLE_NAMES.SCRAPED_URLS}.${SCRAPED_URLS_TABLE.TYPE} = $${
                queryParams.length + 1
            }`
        );
        queryParams.push(utils.escapeSQLWildcards(type.trim()));
    }

    const sanitizedSearchString = searchString ? utils.escapeSQLWildcards(searchString.trim()) : '';
    if (sanitizedSearchString) {
        filters.push(`(${TABLE_NAMES.SCRAPED_URLS}.${SCRAPED_URLS_TABLE.ALT} ilike $${queryParams.length + 1})`);
        queryParams.push(`%${sanitizedSearchString}%`);
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
    const data = await dbService.runQuery(selectStatement, queryParams);

    const countStm = `Select count(*) from ${TABLE_NAMES.SCRAPED_URLS} ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''} ;`;

    const countResult = await dbService.runQuery(countStm, queryParams);
    const totalItems = parseInt(countResult[0].count);

    return {
        data: utils.convertToCamelCaseObject(data),
        totalItems : totalItems,
        totalPage: Math.ceil(totalItems/resultsPerPage)
    }
}

/**
 * @summary add the scraped url data
 * @param {Object} msgBody 
 * @param {PoolClient} dbClient 
 * @returns void
 */
async function add(msgBody, dbClient) {
    const columns = [
        SCRAPED_URLS_TABLE.URL,
        SCRAPED_URLS_TABLE.ALT,
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
