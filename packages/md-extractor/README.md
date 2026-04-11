# md-extractor

記事 URL から本文を取得し、MarkItDown と OpenAI を利用して記事項目を抽出する FastAPI サービス

**注意：このパッケージはPythonプロジェクトです。**

## セットアップ

### 1. 依存関係のインストール

```bash
cd packages/md-extractor
uv sync
```

#### 仮想環境について

- `uv sync` を実行すると、`packages/md-extractor/.venv` に仮想環境が作成されます。
- 仮想環境を有効化する場合は、`source .venv/bin/activate` を実行してください。
- `uv run <command>` を使う場合は、仮想環境を有効化しなくても実行できます。

### 2. 環境変数の設定

```bash
cd packages/md-extractor
cp .env.example .env
```

| 環境変数       | 必須 | デフォルト  | 説明                                               |
| -------------- | ---- | ----------- | -------------------------------------------------- |
| API_SECRET_KEY | ○    | -           | サーバの Bearer トークン認証に使うシークレットキー |
| OPENAI_API_KEY | ○    | -           | OpenAI API キー                                    |
| SERVER_HOST    | ×    | 0.0.0.0     | サーバホスト                                       |
| SERVER_PORT    | ×    | 8080        | サーバポート                                       |
| HOT_RELOAD     | ×    | False       | ホットリロード有効化                               |
| LOG_LEVEL      | ×    | INFO        | ログ出力レベル                                     |
| LOG_FORMAT     | ×    | text        | ログ出力形式 (text or json)                        |
| OPENAI_MODEL   | ×    | gpt-4o-mini | 記事の項目抽出に使う OpenAI モデル                 |

### 3. 開発サーバの起動

```bash
pnpm md dev
```

http://localhost:8080 で起動します。

### 4. Docker Compose での起動

```bash
cd packages/md-extractor

# 起動
docker compose up

# 停止
docker compose down
```

## プロジェクト構成

```
packages/md-extractor
  ├─ src
  │  ├─ api             # HTTP 入出力、認証、例外ハンドリング
  │  ├─ services        # ユースケース、ドメインモデル、出力ポート
  │  ├─ infrastructure  # 外部サービスアクセスの実装
  │  ├─ utils           # ロガー、利用料金計算などの補助処理
  │  ├─ app.py          # FastAPI app 構築
  │  ├─ dependencies.py # DI 配線
  │  ├─ main.py         # サーバ起動エントリーポイント
  │  └─ settings.py     # 設定値管理
  ├─ pyproject.toml     # Python 依存関係・ツール設定
  ├─ uv.lock            # 依存関係ロックファイル
  ├─ Dockerfile
  └─ compose.yaml
```

## 開発コマンド

- `pnpm md check`：`ruff` による静的解析
- `pnpm md check:write`：`ruff --fix` による自動修正
- `pnpm md typecheck`：`pyright` 型チェック
- `pnpm md dev`：開発サーバ起動
- `pnpm md start`：本番想定の起動コマンド
