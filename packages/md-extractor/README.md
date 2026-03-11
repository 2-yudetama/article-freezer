# md-extractor

MarkItDown を利用して記事コンテンツを Markdown として抽出する FastAPI サービス

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
  │  └─ main.py        # FastAPI エントリーポイント
  ├─ pyproject.toml    # Python 依存関係・ツール設定
  ├─ uv.lock           # 依存関係ロックファイル
  ├─ Dockerfile
  └─ compose.yaml
```

## 開発コマンド

- `pnpm md check`：`ruff` による静的解析
- `pnpm md check:write`：`ruff --fix` による自動修正
- `pnpm md typecheck`：`pyright` 型チェック
- `pnpm md dev`：開発サーバ起動
- `pnpm md start`：本番想定の起動コマンド
