const { Pool } = require('pg');
const utils = require('./utils');
const pool = new Pool();

/**
 * @summary private function to get a connection from the pool
 * @returns Promise<Client>
 */
async function getConnection() {
    return pool.connect();
}

/**
 * @summary run the query on the database
 * @param {string} queryString
 * @param {any[]} queryParams
 * @returns any[]
 */
async function runQuery(queryString, queryParams, client) {
    const mainClient = client ? client : await getConnection();

    queryParams = queryParams?.length ? queryParams : [];
    
    const result = await mainClient.query(queryString, queryParams);

    if (!client) {
        await mainClient.release();
    }

    return result.rows;
}

/**
 * @summary prepare the insert statement for the weburls
 * @param {string[]} sourceUrls
 * @returns string
 */
function createInsertStatement(tableName, columns, values) {
    if (columns.length !== values[0].length) {
        throw utils.errorBuilder('columns and values do not match', 500);
    }

    let counter = 0;
    const finalDollarizedParams = values.map((eachInsertGroup) => {
        const dollarizedParams = eachInsertGroup.map(() => {
            counter += 1;
            return `$${counter}`;
        });
        return `(${dollarizedParams.join(',')})`;
    });

    return `insert into ${tableName} (${columns.join(
        ','
    )}) values ${finalDollarizedParams.join(',')}`;
}

module.exports = {
    runQuery,
    getConnection,
    createInsertStatement,
};
