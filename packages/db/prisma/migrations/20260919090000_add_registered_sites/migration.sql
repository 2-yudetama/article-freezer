-- CreateTable
CREATE TABLE "registered_sites" (
    "registered_site_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "site_url" TEXT NOT NULL,
    "site_url_key" VARCHAR(64),
    "display_name" TEXT NOT NULL,
    "feed_url" TEXT,
    "feed_url_key" VARCHAR(64),
    "last_success_at" TIMESTAMPTZ(3),
    "cache_version" BIGINT NOT NULL DEFAULT 0,
    "fetch_token" UUID,
    "fetch_not_before" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "registered_sites_pkey" PRIMARY KEY ("registered_site_id")
);

-- CreateTable
CREATE TABLE "feed_entries" (
    "feed_entry_id" UUID NOT NULL,
    "registered_site_id" UUID NOT NULL,
    "entry_key" VARCHAR(64) NOT NULL,
    "source_entry_id" TEXT,
    "article_url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "published_at" TIMESTAMPTZ(3),
    "first_seen_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "feed_entries_pkey" PRIMARY KEY ("feed_entry_id")
);

-- CreateTable
CREATE TABLE "site_tab_states" (
    "user_id" UUID NOT NULL,
    "last_accessed_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "site_tab_states_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registered_sites_user_id_feed_url_key_key" ON "registered_sites"("user_id", "feed_url_key");

-- CreateIndex
CREATE INDEX "registered_sites_user_id_idx" ON "registered_sites"("user_id");

-- CreateIndex
CREATE INDEX "registered_sites_user_id_site_url_key_idx" ON "registered_sites"("user_id", "site_url_key");

-- CreateIndex
CREATE UNIQUE INDEX "registered_sites_user_id_site_url_key_link_key" ON "registered_sites"("user_id", "site_url_key") WHERE "feed_url" IS NULL AND "site_url_key" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "feed_entries_registered_site_id_entry_key_key" ON "feed_entries"("registered_site_id", "entry_key");

-- CreateIndex
CREATE INDEX "feed_entries_registered_site_id_first_seen_at_entry_key_idx" ON "feed_entries"("registered_site_id", "first_seen_at" DESC, "entry_key" DESC);

-- AddForeignKey
ALTER TABLE "registered_sites" ADD CONSTRAINT "registered_sites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_entries" ADD CONSTRAINT "feed_entries_registered_site_id_fkey" FOREIGN KEY ("registered_site_id") REFERENCES "registered_sites"("registered_site_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_tab_states" ADD CONSTRAINT "site_tab_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
