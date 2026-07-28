# docs/architecture AGENTS.md

このディレクトリは、package をまたぐ実装判断で参照する入口。

機能単位の詳細仕様は `docs/features`、package 固有の作業規則は各 package の `AGENTS.md` を優先する。このディレクトリには、横断的な責務境界と判断時の起点だけを置く。

## package 責務

| package                 | 責務                            |
| ----------------------- | ------------------------------- |
| `packages/web-app`      | Next.js の Web アプリと Web API |
| `packages/db`           | Prisma schema と PostgreSQL     |
| `packages/md-extractor` | 記事 URL からの記事項目抽出 API |

## 読む順番

1. ルート `AGENTS.md`
2. 対象 package の `AGENTS.md`
3. 関連する `docs/features/*`
4. 横断判断が必要な場合だけ、このディレクトリの該当ファイル

## ファイル

- `system-overview.md`: システム全体の論理構成と主要な接続
- `data-flow.md`: package 間の主要なデータフロー
- `auth.md`: 認証・認可の package 間境界
- `er.md`: DB / ドメインデータ構造の ER 図
