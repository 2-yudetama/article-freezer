import "server-only";

import { type Prisma, prisma } from "db";
import {
  ARTICLE_ITEMS_PER_PAGE,
  type ArticleListItem,
  type ArticleListSearchParams,
  type ArticleListSortOption,
  type ArticleListTag,
} from "@/features/articles/list/common";
import { DataIntegrityError } from "@/lib/errors";
import { getPagination } from "@/lib/pagination/server";

type ArticlesListPageData = {
  articles: ArticleListItem[];
  availableTags: ArticleListTag[];
  selectedTagIds: string[];
  sortOption: ArticleListSortOption;
  currentPage: number;
  totalPages: number;
  totalCount: number;
};

type ArticleListRecord = Prisma.ArticleGetPayload<{
  include: {
    articleSource: true;
    article_tags: {
      include: {
        tag: true;
      };
    };
  };
}>;

function getOrderBy(sortOption: ArticleListSortOption) {
  switch (sortOption) {
    case "oldest":
      return { created_at: "asc" as const };
    case "title":
      return { title: "asc" as const };
    case "newest":
      return { created_at: "desc" as const };
  }
}

function buildArticleWhere(userId: string, selectedTagIds: string[]) {
  return {
    user_id: userId,
    ...(selectedTagIds.length > 0
      ? {
          article_tags: {
            some: {
              tag_id: {
                in: selectedTagIds,
              },
            },
          },
        }
      : {}),
  };
}

function toArticleListItem(article: ArticleListRecord): ArticleListItem {
  if (!article.articleSource) {
    throw new DataIntegrityError("Article source is required.");
  }
  if (article.articleSource.type !== "url") {
    throw new DataIntegrityError("Unsupported article source type.");
  }

  return {
    articleId: article.article_id,
    articleSource: {
      type: article.articleSource.type,
      url: article.articleSource.url,
    },
    title: article.title,
    publishedDate: article.published_date,
    content: article.content,
    createdAt: article.created_at.toISOString(),
    isFavorite: article.is_favorite,
    tags: article.article_tags.map(({ tag }) => ({
      tagId: tag.tag_id,
      userId: tag.user_id,
      name: tag.name,
      color: tag.color,
      description: tag.description,
      createdAt: tag.created_at.toISOString(),
      updatedAt: tag.updated_at.toISOString(),
    })),
  };
}

/**
 * 記事一覧ページに必要な記事とタグを取得する
 */
export async function getArticlesListPageData({
  userId,
  searchParams,
}: {
  userId: string;
  searchParams: ArticleListSearchParams;
}): Promise<ArticlesListPageData> {
  // タグ一覧を取得し、URLクエリ由来のタグIDを有効なものだけに絞る
  const articleTags = await prisma.articleTag.findMany({
    where: {
      user_id: userId,
    },
    orderBy: {
      name: "asc",
    },
  });
  const availableTagIds = new Set(articleTags.map((tag) => tag.tag_id));
  const selectedTagIds = searchParams.selectedTagIds.filter((tagId) =>
    availableTagIds.has(tagId),
  );
  const where = buildArticleWhere(userId, selectedTagIds);

  // 絞り込み条件に一致する件数からページング情報を作る
  const totalCount = await prisma.article.count({ where });
  const pagination = getPagination({
    page: searchParams.page,
    perPage: ARTICLE_ITEMS_PER_PAGE,
    totalCount,
  });

  // 現在ページに表示する記事を取得する
  const articles = await prisma.article.findMany({
    where,
    orderBy: getOrderBy(searchParams.sortOption),
    skip: pagination.skip,
    take: pagination.take,
    include: {
      articleSource: true,
      article_tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  // DBの取得結果を画面表示用のデータへ変換する
  return {
    articles: articles.map(toArticleListItem),
    availableTags: articleTags.map((tag) => ({
      tagId: tag.tag_id,
      name: tag.name,
      color: tag.color,
    })),
    selectedTagIds,
    sortOption: searchParams.sortOption,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    totalCount: pagination.totalCount,
  };
}
