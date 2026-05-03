# article-freezer AGENTS.md

## Scope

- このファイルはリポジトリ全体の前提だけを扱う。
- `packages/*` を編集するときは、このファイルを読んだ後に対象 package の `AGENTS.md` を優先する。

## Repo Summary

- pnpm workspace のモノレポ。
- `packages/db`: Prisma + PostgreSQL の管理、Prisma Client 生成、seed、compose。
- `packages/web-app`: Next.js 16 + React 19 の Web アプリ。
- `packages/md-extractor`: Python 3.13 + FastAPI の Markdown 抽出 API。

## Shared Commands

- `mise install`: Node.js / pnpm / Python / uv のバージョン同期
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
- DELETE 系 GitHub 操作は禁止する。
- git の破壊的操作は原則禁止し、必要な場合は人間確認へフォールバックする。
- 開発ツールのバージョンは `.mise.toml` を正本とする。
- JavaScript/TypeScript workspace は `pnpm` 前提。`npm` / `yarn` を混在させない。
- 依存関係は責務のある package に追加し、workspace 共通の開発依存だけをルートに置く。

## Documentation Rules

- エージェント開発ワークフローの運用仕様は `docs/agent` を参照し、通常の単発作業ルールとしては扱わない。
- package 間の責務境界、横断データフロー、認証・認可、ER などの横断設計は `docs/architecture` を参照する。
- 機能仕様は `docs/features` を参照し、機能の挙動や責務を変更した場合は該当ドキュメントも同期して更新する。
- package 固有の制約はルートに書かず、対象 package の `AGENTS.md` に記載する。
- コマンド・構成・アーキテクチャを変更した場合は、対応する `AGENTS.md` / `README.md` も同期して更新する。
