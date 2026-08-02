# 記事保存

## 概要

記事保存機能は、記事 URL から本文を抽出し、コメント・タグとあわせてユーザの記事として保存する機能。

記事 URL からの記事項目抽出には [`md-extractor`](./md-extractor.md) を利用する。

画面は `/users/[userId]/articles/registration` で提供する。

## 画面フロー

記事保存は次のステップで進行する。

1. 記事 URL を入力する
2. `md-extractor` で記事を抽出し、タイトル・投稿日・元 URL・本文プレビューを確認する
3. 記事に対するコメントを入力する
4. 記事に紐づけるタグを選択する
5. 保存内容を確認して保存する

コメントとタグは任意項目。

抽出結果ステップでは、同じ URL の再抽出もできる。再抽出を実行すると、現在の抽出結果を上書きして記事本文を再取得する。

抽出結果ステップでは、任意で記事本文を日本語へ翻訳できる。原文が日本語の場合は本文を変更せず、翻訳対象外であることを表示する。翻訳または言語判定後は、翻訳ボタンを処理結果が分かる無効状態にし、記事情報に原文の言語を日本語の表示名で表示する。判定前の原文言語は「未判定」と表示する。

翻訳済みの記事は再抽出できない。別の記事 URL を抽出した場合は翻訳状態をリセットする。

## API

### `POST /api/users/[userId]/articles/extract`

記事 URL から記事項目を抽出する API。

リクエスト時にユーザの認可を行い、認可されたユーザだけが利用できる。

リクエスト body:

```json
{
  "articleSource": {
    "type": "url",
    "url": "https://example.com/article"
  }
}
```

レスポンス body:

```json
{
  "articleSource": {
    "type": "url",
    "url": "https://example.com/article"
  },
  "title": "記事タイトル",
  "publishedDate": "2026-04-12",
  "content": "記事本文の Markdown"
}
```

`publishedDate` は、抽出できない場合は `null` になる。

内部では `md-extractor` の `POST /api/extract` を呼び出す。

### `POST /api/users/[userId]/articles/translate`

抽出済みの記事 Markdown を日本語へ翻訳する API。

リクエスト時にユーザの認可を行い、認可されたユーザだけが利用できる。

リクエスト body:

```json
{
  "markdown": "# Article title\n\nArticle content."
}
```

翻訳した場合のレスポンス body:

```json
{
  "sourceLanguage": "en",
  "translatedMarkdown": "# 記事タイトル\n\n記事本文。"
}
```

原文が日本語の場合、`translatedMarkdown` は `null` になる。内部では `md-extractor` の `POST /api/translate` を呼び出す。

### `POST /api/users/[userId]/articles/registration`

抽出済みの記事情報とユーザ入力を保存する API。

リクエスト時にユーザの認可を行い、認可されたユーザだけが利用できる。

リクエスト body:

```json
{
  "article": {
    "articleSource": {
      "type": "url",
      "url": "https://example.com/article"
    },
    "title": "記事タイトル",
    "publishedDate": "2026-04-12",
    "content": "記事本文の Markdown"
  },
  "comment": {
    "comment": "記事に対するコメント"
  },
  "selectedTagIds": ["0f8fad5b-d9cb-469f-a165-70867728950e"]
}
```

レスポンス body:

```json
{
  "articleId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "userId": "2c9e6679-7425-40de-944b-e07fc1f90ae7",
  "articleSource": {
    "type": "url",
    "url": "https://example.com/article"
  },
  "title": "記事タイトル",
  "publishedDate": "2026-04-12",
  "content": "記事本文の Markdown",
  "isFavorite": false,
  "createdAt": "2026-04-12T00:00:00.000Z",
  "updatedAt": "2026-04-12T00:00:00.000Z",
  "comment": {
    "commentId": "3c9e6679-7425-40de-944b-e07fc1f90ae7",
    "articleId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "userId": "2c9e6679-7425-40de-944b-e07fc1f90ae7",
    "comment": "記事に対するコメント",
    "createdAt": "2026-04-12T00:00:00.000Z",
    "updatedAt": "2026-04-12T00:00:00.000Z"
  },
  "tags": []
}
```

保存に成功した場合は `201` を返す。

## バリデーション

記事保存では次の検証を行う。

- URL は URL 形式であること
- 抽出結果は `title`、`publishedDate`、`content` の形式が正しいこと
- コメントは任意だが、入力する場合は 1000 文字以内であること
- タグ ID は重複していないこと
- 選択されたタグ ID がユーザのタグとして存在すること

`md-extractor` から返されたエラーは、Web アプリ側の API エラーレスポンスに変換して画面へ返す。

## 永続化

保存時は Prisma で次のデータを保存する。

1. `articles` に記事本体を保存する
2. `article_sources` に入力元 URL を保存する
3. コメントがある場合は `article_comments` に保存する
4. タグが選択されている場合は `article_tags_articles` に記事とタグの関連を保存する

`articles.is_favorite` は保存時点では `false` になる。

## 現状の注意点

タグ選択 UI の候補は現状 `mockTags` を参照している。

記事本文の抽出処理は Web アプリでは行わず、`md-extractor` に委譲する。Web アプリ側では `MD_EXTRACTOR_BASE_URL` と `MD_EXTRACTOR_API_SECRET_KEY` を使って `md-extractor` に接続する。
