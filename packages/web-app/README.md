# web-app

Webアプリケーションのパッケージ

## セットアップ

### 1. 依存関係のインストール

```bash
cd packages/web-app
pnpm -F web-app install

# or ルートディレクトリから
pnpm install
```

### 2. 環境変数の設定

```bash
cd packages/web-app
cp .env.example .env
```

### 3. ビルド

```bash
pnpm web-app build
```

### 4. 開発サーバの起動

#### 単体起動

[packages/db/README.md - セットアップ](../db/README.md#セットアップ) を参考に、データベースを事前に起動してください。

```bash
pnpm web-app dev
```

http://localhost:3000 でアプリが起動します。

#### Docker compose

Docker Composeを使用して、DBとWebアプリを一括で起動できます。

```bash
# 起動
docker compose up

# 停止
docker compose down
```

## プロジェクト構成

```
web-app/src
  ├─ app/         # App Router
  ├─ components/  # 共通コンポーネント
  ├─ features/    # 機能別コンポーネント
  ├─ lib/         # ライブラリ
  │
  └─ proxy.ts
```

## 開発コマンド

- `pnpm web-app typecheck`：`tsc`型チェック
- `pnpm web-app build`：Next.jsアプリビルド
- `pnpm web-app dev`：開発サーバ起動
- `pnpm web-app start`：本番サーバ起動
- `pnpm web-app test`：テスト実行
- `pnpm web-app test:watch`：テスト実行(ウォッチモード)
- `pnpm web-app test:coverage`：テスト実行(カバレッジ)
