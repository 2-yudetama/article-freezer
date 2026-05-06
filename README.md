# Article Freezer

記事サイトのURLから、記事をMarkdownとして取得・保管するアプリ

**私的使用のための複製を目的とした、個人利用ツールです**

## 主要機能

- 記事URLからのMarkdown抽出
- 取得した記事の保存
- 保存記事の閲覧

機能の詳細は[docs/features](./docs/features/)を参照してください。

## セットアップ

### 1. 開発ツールのインストール

本リポジトリでは、Node.js / pnpm / Python / uv のバージョン管理に[mise](https://mise.jdx.dev/)を使用します。

```bash
mise trust
mise install
```

### 2. 依存関係のインストール

```bash
pnpm install
```

Pythonパッケージの依存関係は、必要に応じて以下で同期してください。

```bash
uv sync --project packages/md-extractor
```

### 3. 環境変数の設定

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

### 4. データベースの起動

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

### 5. 開発サーバの起動

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
- `packages/md-extractor`：記事マークダウン化
  - README.mdは[こちら](./packages/md-extractor/README.md)
  - **注意：このパッケージはPythonプロジェクトです**
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

## リリース

`v` prefix付きのSemantic Versionタグをpushすると、GitHub ActionsでReleaseが自動作成されます。

```bash
git tag v1.0.0
git push origin v1.0.0
```

タグは`v1.2.3`形式を基本とし、プレリリースやビルドメタデータも利用できます。

```bash
git tag v1.0.0-beta.1
git tag v1.0.0+build.1
```

Release作成時はGitHubの自動リリースノート生成を使用します。リリースノートの分類は[.github/release.yaml](./.github/release.yaml)で管理します。

リリースノートに含めるPRは、以下のラベルで分類されます。

- `feature`: ✨ Features
- `enhancement`: ⚡️ Enhancements
- `bug`: 🐛 Bug Fixes
- `documentation`: 📝 Documentation
- `refactoring`: ♻️ Refactoring

## License

No License
