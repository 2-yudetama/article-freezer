# packages/db AGENTS.md

## Role

- Prisma schema の管理、Prisma Client の生成、PostgreSQL 接続、seed を担当する package。

## Working Rules

- データ構造を変えるときは `prisma/schema.prisma` を正本として編集する。
- `src/generated/prisma` は `prisma generate` の生成物。手編集しない。
- 接続設定と PrismaClient 初期化の変更時は `src/env.ts` と `src/client.ts` を起点に確認する。

## Common Commands

- `pnpm db prisma:generate`: Prisma Client 再生成
- `pnpm db build`: package ビルド
- `pnpm db typecheck`: 型チェック
- `pnpm db prisma:migrate`: migration 作成と適用
- `pnpm db prisma:migrate-sql`: migration ファイル作成
- `pnpm db prisma:deploy`: migration 適用
- `pnpm db prisma:seed`: seed 実行
- `pnpm db db:up`: データベース起動
- `pnpm db db:down`: データベース停止

## Dangerous Commands

- `pnpm db prisma:reset`
  - 開発 DB をリセットして migration/seed をやり直す。破壊的。

## Directory Tree

- Prisma schema を正本に据える Schema-First Architecture。
- schema、実行コード、ローカル運用設定を分離し、変更起点を明確にする。

```text
packages/db
├─ prisma/               # schema と migration の正本
├─ src/                  # Prisma Client 初期化、環境変数解決、seed、公開 API
├─ compose.yaml          # ローカル PostgreSQL / pgweb の起動定義
└─ prisma.config.ts      # Prisma 実行時設定
```

## TBD

- `users` 以外の記事・タグ関連 schema をどこまでこの package に追加する想定か
- `role` を数値のまま運用するか、enum / 定数化するか
- migration ファイル名とレビュー方針のチームルール
