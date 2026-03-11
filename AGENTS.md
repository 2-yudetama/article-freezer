# article-freezer AGENTS.md

## Scope

- このファイルはリポジトリ全体の前提だけを扱う。
- `packages/*` を編集するときは、このファイルを読んだ後に対象 package の `AGENTS.md` を優先する。

## Repo Summary

- pnpm workspace のモノレポ。
- `packages/db`: Prisma + PostgreSQL の管理、Prisma Client 生成、seed、compose。
- `packages/web-app`: Next.js 16 + React 19 の Web アプリ。
- `packages/md-extractor`: Python 3.13 + FastAPI の Markdown 抽出 API。
- `docs`: ER 図、記事登録フロー図などの補助資料。

## Shared Commands

- `pnpm install`: workspace 全体の依存関係インストール
- `pnpm check`: Biome Lint
- `pnpm check:write`: Biome Lint(自動修正)
- `pnpm knip`: 未使用ファイル・依存関係検出
- `pnpm --recursive run typecheck`: 型チェック(全package)
- `pnpm web-app dev`: Web アプリ開発サーバ起動
- `pnpm md dev`: FastAPI開発サーバ起動
- `pnpm db db:up`: データベース起動
- `pnpm db db:down`: データベース停止
- `docker compose up`: workspace 全体のサービス起動
- `docker compose down`: workspace 全体のサービス停止

## Shared Constraints

- **`.env`などの環境変数ファイルは参照しない。環境変数を確認したい場合は`.env.example`を参照する。**
- JavaScript/TypeScript workspace は `pnpm` 前提。`npm` / `yarn` を混在させない。
- 依存関係は責務のある package に追加し、workspace 共通の開発依存だけをルートに置く。
- TypeScript/TSX は Biome 前提。インデントはスペース 2、import 整理は自動化されている。
- pre-commit では Biome、Ruff、Knip、lockfile 整合性チェックが走る。
- 現状、専用テストファイルは見当たらない。挙動変更時は何を確認したかを明記する。

## Documentation Rules

- package 固有の制約はルートに書かず、対象 package の `AGENTS.md` に記載する。
- コマンド・構成・アーキテクチャを変更した場合は、対応する `AGENTS.md` / `README.md` も同期して更新する。

## TBD

- `web-app` から `md-extractor` を呼び出す正式な接続方法と責務分界
- 記事・タグの永続化をどの package / 層で担うか
- 本番運用での compose / deploy の正規フロー
