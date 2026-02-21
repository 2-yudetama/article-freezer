# Article Freezer

Zenn・Qittaの記事URLから、記事の要約を生成して保管するアプリ

**私的使用のための複製を目的とした、個人利用ツールです**

## 主要機能

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. 環境変数の設定

本リポジトリはMonorepo構成のため、各パッケージで環境変数を設定してください。

#### dbパッケージ

[packages/db/README.md](packages/db/README.md#2-環境変数の設定)を参考に環境変数を設定してください。

```bash
cd packages/db
cp .env.example .env
```

#### web-appパッケージ

[packages/web-app/README.md](packages/web-app/README.md#2-環境変数の設定)を参考に環境変数を設定してください。

```bash
cd packages/web-app
cp .env.example .env
```

### 3. データベースの起動

初回起動時はマイグレーションを行ってください。

```bash
pnpm db prisma:migrate
pnpm db prisma:seed
```

以下のコマンドでデータベースを起動してください。

```bash
# DB起動
pnpm db db:up

# DB停止
pnpm db db:down
```

http://localhost:8081 でPgwebが起動します。

### 4. 開発サーバの起動

以下のコマンドで、開発サーバの起動を行ってください。

```bash
pnpm web-app dev
```

http://localhost:3000 でアプリが起動します。

### Docker Compose

Docker Composeを使用して、DBとWebアプリを一括で起動できます。

```bash
# 起動
docker compose up

# 停止
docker compose down
```

## プロジェクト構成

pnpmの[ワークスペース](https://pnpm.io/ja/workspaces)機能を利用したMonorepo構成となっています。

- `packages/db`：データベース管理
  - README.mdは[こちら](./packages/db/README.md)
- `packages/web-app`：Webアプリケーション
  - README.mdは[こちら](./packages/web-app/README.md)

## 開発コマンド

**コード品質**

```bash
# biome
pnpm check
pnpm check:write # 自動修正

# knip
pnpm knip

# typecheck
pnpm --recursive run typecheck
```

**ビルド**

```bash
# 一括ビルド
pnpm --recursive run build

# 個別ビルド
pnpm db build
pnpm web-app build
```

**サーバ起動**

```bash
# 開発サーバ
pnpm web-app dev

# 本番サーバ
pnpm web-app start
```

**データベース**

```bash
# DB起動
pnpm db db:up

# DB停止
pnpm db db:down
```

## License

No License
