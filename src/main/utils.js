const camelCase = require('camelcase');

/**
 * @summary escapes some characters for safer sql
 * @param {String} str 
 * @returns {String}
 */
function escapeSQLWildcards(str) {
    return str.replace(/%|'|_|[|]/g, (char) => `\\${char}`);
}

/**
 * @summary convert the keys to camelCasee
 * @param {Object} data 
 * @returns {Object}
 */
function convertToCamelCaseObject(data) {
    if (!data) {
        return data;
    }
    if (data instanceof Array) {
        return data.map((value) => {
            if (typeof value === 'object') {
                value = this.convertToCamelCaseObject(value);
            }
            return value;
        });
    }
    let newData = {};
    for (let origKey in data) {
        if (data.hasOwnProperty(origKey)) {
            const newKey = camelCase(origKey);
            let value = data[origKey];
            if (value instanceof Array || (value && Object.keys(value).length && typeof value === 'object' && value.constructor !== new Date().constructor)) {
                value = this.convertToCamelCaseObject(value);
            }
            newData[newKey] = value;
        }
    }
    return newData;
}

/**
 * @summary create custom error type
 * @param {String} message 
 * @param {Number} errorCode 
 * @returns Error
 */
function errorBuilder(message, errorCode) {
    const err = new Error(message);
    err.statusCode = errorCode;
    return err;
}

module.exports = {
    escapeSQLWildcards,
    convertToCamelCaseObject,
    errorBuilder
};
