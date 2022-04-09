const { Pool } = require('pg');

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
    const mainClient = client ? client: await getConnection();

    queryParams = queryParams?.length ? queryParams : [];
   
    console.log(`query struing -> ${queryString}`);
    console.log(`query parms -> ${queryParams}`);
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
        return 'chi chi';
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

function createSelectStatement(
    tableName,
    columns,
    filters,
    limit,
    offset,
    orderBy
) {
    let columnsToFind = columns?.length ? columns.join(',') : '*';

    const whereConditions = [];
    const queryParams = [];

    for (const [key, value] of Object.entries(filters || {})) {
        if (Array.isArray(value)) {
            whereConditions.push(
                `${key} IN (${value.map((_, idx) => `$${idx + 1}`).join(',')})`
            );
            queryParams.push(...value);
        } else {
            whereConditions.push(`${key}=$${queryParams + 1}`);
            queryParams.push(value);
        }
    }
    const finalWhereStm = filters && Object.keys(filters).length ? `WHERE ${whereConditions.join('AND')}` : '';

    const limitStm = limit ? `LIMIT ${limit}` : '';
    const offsetStm = offset ? `OFFSET ${offset}` : '';

    let orderByStm = '';
    if (orderBy) {
        orderByStm = `ORDER BY ${orderBy.key} ${orderBy.direction}`;
    }

    return {
        queryString: `SELECT ${columnsToFind} FROM ${tableName} ${finalWhereStm} ${orderByStm} ${limitStm} ${offsetStm};`,
        queryParams,
    };
}

module.exports = {
    runQuery,
    getConnection,
    createInsertStatement,
    createSelectStatement,
};
