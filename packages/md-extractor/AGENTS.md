# packages/md-extractor AGENTS.md

## Role

- 記事 URL から記事項目を抽出する FastAPI service。
- 機能仕様は [docs/features/md-extractor.md](../../docs/features/md-extractor.md) を参照する。

## Working Rules

- Python 3.13 + `uv` 前提の package。依存追加や実行は `uv sync`, `uv run` を使う。
- `services` の port を境界に、入力アダプタと出力アダプタの責務を分離する。
- `pip` / `requirements.txt` ベースの運用を持ち込まない。

## Common Commands

- `uv sync`: 依存関係同期
- `pnpm md dev`: 開発サーバ起動
- `pnpm md start`: API 起動
- `pnpm md check`: Ruff Lint
- `pnpm md check:write`: Ruff Lint(自動修正)
- `pnpm md typecheck`: 型チェック

## Directory Tree

- Hexagonal Architecture (Ports and Adapters) をベースにした構成。
- `services` を中心に、`api` を入力アダプタ、`infrastructure` を出力アダプタとして分離する。
  - `api`: 入力アダプタ
  - `api/auth.py`: Bearer トークン認証
  - `api/exception.py`: 例外とエラーレスポンスの変換、request id 付与
  - `services/*/usecase.py`: アプリケーション層
  - `services/*/model.py`: ドメインモデル
  - `services/*/port.py`: 出力ポート
  - `infrastructure/*/gateway/adapter.py`: 外部サービスアクセスの実装
  - `dependencies.py`: Composition Root / DI 配線
  - `utils`: ユーティリティ

```text
src
├─ api/                                  # 入力アダプタ。HTTP 入出力、認証、request/response model
├─ services/*/                           # 機能単位のアプリケーション層
│  ├─ usecase.py                         # ユースケース実装
│  ├─ model.py                           # ドメインモデル
│  └─ port.py                            # 出力ポート
├─ infrastructure/*/                     # 機能単位の出力アダプタ実装層
│  └─ gateway/adapter.py                 # 外部サービスアクセスの実装
├─ utils/                                # ユーティリティ
├─ dependencies.py                       # Composition Root / DI 配線
├─ app.py                                # FastAPI app 構築と router 登録
├─ main.py                               # サーバ起動 entrypoint
└─ settings.py                           # 設定値管理
```
