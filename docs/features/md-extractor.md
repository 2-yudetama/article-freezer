# md-extractor

## 概要

`md-extractor` は、記事 URL から本文を取得し、MarkItDown で Markdown 化した後に OpenAI で記事項目を抽出する FastAPI サービス。

抽出した記事 Markdown の主要言語を判定し、日本語へ翻訳する API も提供する。

## API

### `GET /api/health`

ヘルスチェック用の API。

レスポンス:

```json
{
  "status": "ok"
}
```

### `POST /api/extract`

記事 URL から記事項目を抽出する API。

`Authorization: Bearer <API_SECRET_KEY>` による Bearer トークン認証が必要。

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

`publishedDate` は、本文やメタ情報から特定できない場合は `null` になる。

### `POST /api/translate`

記事 Markdown の主要言語を判定し、日本語へ翻訳する API。

`Authorization: Bearer <API_SECRET_KEY>` による Bearer トークン認証が必要。

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

原文が日本語の場合のレスポンス body:

```json
{
  "sourceLanguage": "ja",
  "translatedMarkdown": null
}
```

`sourceLanguage` は、原文で主に使用されている言語を BCP 47 言語コードで表す。

`translatedMarkdown` は原文が日本語の場合に限り `null` になる。言語判定や翻訳処理に失敗した場合は、エラーレスポンスを返す。

レスポンスのステータスコードは `200` になる。

## URL 制約

`POST /api/extract` の URL は次の条件を満たす必要がある。

- `https` URL であること
- `localhost` または `.localhost` で終わるホスト名ではないこと
- IP アドレスを直接指定した URL ではないこと
- DNS 解決結果が内部ネットワーク向けや特殊用途の IP アドレスではないこと

## 処理フロー

1. URL の安全性を検証する
2. URL から記事コンテンツを取得する
3. MarkItDown で取得コンテンツを Markdown に変換する
4. OpenAI で Markdown から `title`、`publishedDate`、`content` を抽出する

## 翻訳処理フロー

1. 記事 Markdown の主要言語を判定する
2. 原文が日本語の場合は翻訳せず、`translatedMarkdown` を `null` にする
3. 原文が日本語以外の場合は、Markdown 構造を維持して日本語へ翻訳する
