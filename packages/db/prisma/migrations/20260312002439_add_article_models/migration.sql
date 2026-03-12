-- CreateTable
CREATE TABLE "articles" (
    "article_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "published_date" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("article_id")
);

-- CreateTable
CREATE TABLE "article_sources" (
    "article_id" UUID NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "article_sources_pkey" PRIMARY KEY ("article_id")
);

-- CreateTable
CREATE TABLE "article_comments" (
    "comment_id" UUID NOT NULL,
    "article_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "article_comments_pkey" PRIMARY KEY ("comment_id")
);

-- CreateTable
CREATE TABLE "article_tags" (
    "tag_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "color" VARCHAR(7) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "article_tags_pkey" PRIMARY KEY ("tag_id")
);

-- CreateTable
CREATE TABLE "article_tags_articles" (
    "article_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "article_tags_articles_pkey" PRIMARY KEY ("article_id","tag_id")
);

-- CreateIndex
CREATE INDEX "articles_user_id_idx" ON "articles"("user_id");

-- CreateIndex
CREATE INDEX "article_sources_type_idx" ON "article_sources"("type");

-- CreateIndex
CREATE UNIQUE INDEX "article_comments_article_id_key" ON "article_comments"("article_id");

-- CreateIndex
CREATE INDEX "article_comments_user_id_idx" ON "article_comments"("user_id");

-- CreateIndex
CREATE INDEX "article_tags_user_id_idx" ON "article_tags"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "article_tags_user_id_name_key" ON "article_tags"("user_id", "name");

-- CreateIndex
CREATE INDEX "article_tags_articles_tag_id_idx" ON "article_tags_articles"("tag_id");

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_sources" ADD CONSTRAINT "article_sources_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("article_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("article_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_tags_articles" ADD CONSTRAINT "article_tags_articles_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("article_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_tags_articles" ADD CONSTRAINT "article_tags_articles_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "article_tags"("tag_id") ON DELETE CASCADE ON UPDATE CASCADE;
