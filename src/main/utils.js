const camelCase = require('camelcase');

function escapeSQLWildcards(str) {
    return str.replace(/%|'|_|[|]/g, (char) => `\\${char}`);
}

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

module.exports = {
    escapeSQLWildcards,
    convertToCamelCaseObject
};
