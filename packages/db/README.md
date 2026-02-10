# db

PostgreSQL と Prisma Client を扱うデータベース管理用のパッケージ。

## 主要機能

- Prisma Client の生成とエクスポート
- PostgreSQL のコンテナ起動と pgweb による確認
- Prisma のマイグレーション運用

## セットアップ

### 1. 依存関係のインストール

```bash
cd packages/db
pnpm -F db install

# or ルートディレクトリから
pnpm install
```

### 2. 環境変数の設定

```bash
cd packages/db
cp .env.example .env
```

### 3. ビルド

```bash
pnpm db build
```

### 4. マイグレーション

```bash
# 開発環境
pnpm db prisma:migrate

# 本番環境
pnpm db prisma:deploy
```

### 5. 開発サーバの起動

```bash
# 起動
pnpm db db:up

# 停止
pnpm db db:down
```

pgweb は http://localhost:8081 で確認できます。

## プロジェクト構成

```
packages/db
  ├─ prisma
  │  └─ schema.prisma   # スキーマ定義
  ├─ src
  │   ├─ client.ts      # Prisma クライアント
  │   └─ index.ts       # エントリーポイント
  │
  └─ compose.yaml       # PostgreSQL/pgweb の構成
```

## 開発コマンド

- `pnpm db build`：Prisma Client 生成 + `tsc`ビルド
- `pnpm db typecheck`：`tsc`型チェック
- `pnpm db db:up`：Postgres/pgweb の起動
- `pnpm db db:down`：Postgres/pgweb の停止
- `pnpm db prisma:generate`：Prisma Client 生成
- `pnpm db prisma:migrate`：マイグレーション作成・適用（開発向け）
- `pnpm db prisma:migrate-sql`：SQL のみ作成
- `pnpm db prisma:deploy`：マイグレーション適用（本番向け）
- `pnpm db prisma:reset`：DBリセット
