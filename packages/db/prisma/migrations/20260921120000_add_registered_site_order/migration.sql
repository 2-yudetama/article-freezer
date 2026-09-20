-- AlterTable
ALTER TABLE "registered_sites" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

-- Preserve the existing created-at order when initializing the new column
WITH ranked_sites AS (
    SELECT
        "registered_site_id",
        ROW_NUMBER() OVER (
            PARTITION BY "user_id"
            ORDER BY "created_at" ASC, "registered_site_id" ASC
        ) - 1 AS "sort_order"
    FROM "registered_sites"
)
UPDATE "registered_sites" AS sites
SET "sort_order" = ranked_sites."sort_order"
FROM ranked_sites
WHERE sites."registered_site_id" = ranked_sites."registered_site_id";

-- CreateIndex
CREATE INDEX "registered_sites_user_id_sort_order_registered_site_id_idx"
ON "registered_sites"("user_id", "sort_order", "registered_site_id");
