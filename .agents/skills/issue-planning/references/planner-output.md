# issue-planning reference

## 調査手順

1. issue 本文、コメント、ラベル、マイルストーンを確認する
2. ルートと対象 package の `AGENTS.md` を確認する
3. 関連する `docs/features` と `docs/architecture` を確認する
4. 既存コードの入口を `rg` と `rg --files` で探す
5. 関連 issue / PR が明示されている場合だけ確認する
6. 判断できない事項は推測で埋めず、`リスク・確認事項` に残す

## Planner Output 契約

- Planner Output は `implementation-plan` または `split-proposal` のどちらか一方を必ず含める
- 1 PR で扱える場合は `Type: implementation-plan` を明記する
- 分割が必要な場合は `Type: split-proposal` を明記する
- 両方を同時に含めない
- Planner 自身が `output-comment` skill を使い、対象 issue に `AI: Planner Output` として投稿する
- Planner Output の採用可否、差し戻し、分割実行、人間確認は Manager が `plan-review` で判断する

## implementation-plan

- 対象 issue
- 要求整理
- スコープ
- スコープ外
- 受け入れ条件
- Generator が満たすべき実装契約
- 想定される変更領域
- 検証計画
- リスク・確認事項

### Generator が満たすべき実装契約

- 実装後に成立しているべき振る舞い
- 変更してよい責務境界
- 変更してはいけないスコープ外事項
- 同期が必要なドキュメント
- Generator が判断してよい軽微な実装裁量
- Manager に戻すべき未決定事項

## split-proposal

- 対象 issue
- 分割が必要な理由
- 分割方針
- サブ issue 案
- 各サブ issue の目的、スコープ、受け入れ条件
- サブ issue 間の依存関係
- 推奨対応順
- 親 issue で直接実装を続けるべきでない理由
- リスク・確認事項

## 分割判断の目安

- 1 PR で完了させるには変更範囲が広い
- 複数 package や複数機能にまたがり、受け入れ条件を分けた方が評価しやすい
- DB スキーマ、API 契約、UI、運用ドキュメントなど、検証観点が異なる作業が混在している
- 前段の設計・整備が完了しないと後続の実装に進めない
