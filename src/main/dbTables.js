const TABLE_NAMES = Object.freeze({
    SOURCE_URLS: 'source_urls',
    SCRAPED_URLS: 'scraped_urls',
});

const SOURCE_URLS_TABLE = Object.freeze({
    ID: 'id',
    URL: 'url',
    IS_SCRAPED: 'is_scraped',
    RETRIES: 'retries',
    ERROR: 'error' ,
    CREATED_AT: 'created_at', 
    UPDATED_AT: 'updated_at' 
});

const SCRAPED_URLS_TABLE = Object.freeze({
    ID: 'id',
    URL: 'url',
    TYPE: 'type',
    SOURCE_URL_ID: 'source_url_id' ,
    CREATED_AT: 'created_at', 
    UPDATED_AT: 'updated_at' 
});

module.exports = {
    TABLE_NAMES,
    SOURCE_URLS_TABLE,
    SCRAPED_URLS_TABLE
};
