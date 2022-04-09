CREATE TABLE source_urls(
    id bigserial PRIMARY KEY,
    url text NOT NULL UNIQUE,
    is_scraped boolean NOT NULL DEFAULT false,
    retries integer not null default 0,
    error text,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TYPE scraped_url_type as ENUM('video','image');

CREATE TABLE scraped_urls(
    id bigserial PRIMARY KEY,
    url text NOT NULL,
    alt text,
    type scraped_url_type NOT NULL,
    source_url_id BIGINT not null,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (source_url_id) REFERENCES source_urls(id)
);