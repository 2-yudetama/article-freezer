"use client";

import { useArticleRegistration } from "@/features/articles/registration/hooks/use-article-registration";
import ArticleRegistrationPageView from "@/features/articles/registration/ui/page-view";

/** 記事登録ページを表示する関数 */
export default function ArticleRegistrationPage() {
  const registration = useArticleRegistration();

  return <ArticleRegistrationPageView {...registration} />;
}
