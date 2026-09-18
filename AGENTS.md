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

Codex sandbox で pnpm を実行する場合は corepack 経由で実行してください。

```bash
corepack pnpm <root-script> <package-script>
```

ルートから workspace script を呼び出せます。具体的なコマンドは、対象 package の `AGENTS.md` を確認してください。

## Shared Constraints

- **`.env`などの環境変数ファイルは参照しない。環境変数を確認したい場合は`.env.example`を参照する。**
- DELETE 系 GitHub 操作は禁止する。
- git の破壊的操作は原則禁止し、必要な場合は人間確認へフォールバックする。
- 開発ツールのバージョンは `.mise.toml` を正本とする。
- JavaScript/TypeScript workspace は `pnpm` 前提。`npm` / `yarn` を混在させない。
- 依存関係は責務のある package に追加し、workspace 共通の開発依存だけをルートに置く。

## Git Rules

- commit message は `{Gitmoji} {メッセージタイトル} (#{issue番号})` 形式にする。
- 例: `📝 mise セットアップ手順を追加 (#56)`
- 変更は意図が分かる粒度で分割し、まとまった意図ごとに都度 commit する。
- commit message は変更内容だけでなく、変更の意図が分かるタイトルにする。
- push は `git push origin issue/{issue番号}` のように remote と branch を明示する。
- 引数なし `git push` や upstream 設定に依存した push は使わない。

## Documentation Rules

- package 間の責務境界、横断データフロー、認証・認可、ER などの横断設計は `docs/architecture` を参照する。
- 機能仕様は `docs/features` を参照し、機能の挙動や責務を変更した場合は該当ドキュメントも同期して更新する。
- package 固有の制約はルートに書かず、対象 package の `AGENTS.md` に記載する。
- コマンド・構成・アーキテクチャを変更した場合は、対応する `AGENTS.md` / `README.md` も同期して更新する。
