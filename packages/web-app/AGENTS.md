# packages/web-app AGENTS.md

## Role

- Next.js App Router のフロントエンド package。
- 認証、ユーザ別ルーティング、記事一覧・詳細・編集・登録、タグ管理、設定 UI を持つ。

## Working Rules

- `src/app/users/[userId]/*` の route は薄く保ち、実処理は `src/features/*/page.tsx` に委譲する構成を維持する。
- `src/features/*/page.tsx` は `hook + view` 構成が基本。状態取得は hooks、表示は `ui/page-view.tsx` に寄せる。
- 認証・認可の変更時は `src/lib/auth/auth.ts` と `src/app/users/[userId]/layout.tsx` を起点に確認する。
- 記事・タグ系画面は現状 `src/lib/mock-data.ts` を参照している。永続化済みとみなして実装しない。

## Common Commands

- `pnpm web-app dev`: 開発サーバ起動
- `pnpm web-app build`: 本番ビルド
- `pnpm web-app start`: 本番サーバ起動
- `pnpm web-app typecheck`: 型チェック
- `pnpm web-app test`: テスト実行
- `pnpm web-app test:watch`: テスト監視実行
- `pnpm web-app test:coverage`: カバレッジ付きテスト実行

## Directory Tree

- App Router を入口にし、画面実装を feature 単位で分割する Feature-Based Architecture。
- routing、feature、shared UI、library の責務を分離し、画面ロジックと描画を分ける。

```text
src
├─ app/                  # App Router の route 定義と layout。page は薄く保ち feature に委譲する
├─ features/             # 画面単位の実装。page を入口に hooks と ui へ責務を分ける
├─ components/           # 再利用 UI、navigation、provider などの画面横断コンポーネント
├─ lib/                  # auth、utilities、仮データ、共通型
└─ proxy.ts              # アプリ外縁の補助処理
```

## TBD

- 記事・タグデータをどの層で取得・更新するか
- `/auth/notfound` は今後作る想定か、別 route に統一するか
- `role === 1` の暫定制御をいつ/どう置き換えるか
