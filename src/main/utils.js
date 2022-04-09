function escapeSQLWildcards(str) {
    return str.replace(/%|'|_|[|]/g, (char) => `\\${char}`);
}

module.exports = {
    escapeSQLWildcards,
};
