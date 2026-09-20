-- DropIndex
DROP INDEX "feed_entries_registered_site_id_first_seen_at_entry_key_idx";

-- CreateIndex
CREATE INDEX "feed_entries_registered_site_id_published_at_entry_key_idx" ON "feed_entries"("registered_site_id", "published_at" DESC, "entry_key" DESC);
