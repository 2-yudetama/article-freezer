# packages/web-app AGENTS.md

## Role

- Next.js App Router のフロントエンド package。
- 認証、ユーザ別ルーティング、記事一覧・詳細・編集・登録、タグ管理、設定 UI を持つ。

## Architecture Rules

- `src/app/users/[userId]/*` の route は薄く保ち、実処理は `src/features/*/page.tsx` に委譲する構成を維持する。
- `src/features/*/page.tsx` / `page-client.tsx` は薄く保ち、状態取得や操作は `hooks`、表示は `ui` 配下のコンポーネントに分ける。
- Client Component は必要な leaf 側に寄せ、`use client` を route や server-only 処理へ広げない。

## Code Style

- `src/features/*/ui` の UI コンポーネントは `ArticleHeader.tsx` のように PascalCase のファイル名にする。
- `src` 配下の import は、深い相対パスより `@/` alias を優先する。
- 汎用 UI は新規実装前に `src/components/ui` の既存コンポーネントを優先して確認する。

## Feature References

- 記事一覧・登録などの機能仕様は `docs/features` を参照する。
- 認証・認可の変更時は `src/lib/auth/auth.ts` と `src/app/users/[userId]/layout.tsx` を起点に確認する。
- タグ系画面は現状 `src/lib/mock-data.ts` を参照している。永続化済みとみなして実装しない。

## Common Commands

- `pnpm web-app dev`: 開発サーバ起動
- `pnpm web-app build`: 本番ビルド
- `pnpm web-app start`: 本番サーバ起動
- `pnpm web-app typecheck`: 型チェック
- `pnpm web-app test`: テスト実行
- `pnpm web-app test:watch`: テスト監視実行
- `pnpm web-app test:coverage`: カバレッジ付きテスト実行

## Directory Tree

- App Router を入口にし、画面実装を feature 単位で分割する Feature-Based Architecture。
- routing、domain、feature、shared UI、library の責務を分離し、画面ロジックと描画を分ける。

```text
src
├─ app/                  # App Router の route 定義と layout。page は薄く保ち feature に委譲する
├─ features/             # 画面単位の実装。page を入口に hooks と ui へ責務を分ける
├─ components/           # 再利用 UI、navigation、provider などの画面横断コンポーネント
├─ domain/               # feature 横断のドメインスキーマ・型
├─ lib/                  # auth、utilities、仮データ、共通型
└─ proxy.ts              # アプリ外縁の補助処理
```
