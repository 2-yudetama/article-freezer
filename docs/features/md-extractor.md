# md-extractor

## 概要

`md-extractor` は、記事 URL から本文を取得し、MarkItDown で Markdown 化した後に OpenAI で記事項目を抽出する FastAPI サービス。

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
