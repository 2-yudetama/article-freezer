# ロール定義ドラフト

このファイルは、正式移行時に `docs/agent/roles/*.md` へ分割するための元ドラフト。
正式ドキュメントでは `roles.md` は作成しない。

## 移行先

```txt
docs/agent/
  roles/
    manager.md
    planner.md
    generator.md
    evaluator.md
```

## 分割方針

- `Manager` セクションは `docs/agent/roles/manager.md` へ移す
- `Planner` セクションは `docs/agent/roles/planner.md` へ移す
- `Generator` セクションは `docs/agent/roles/generator.md` へ移す
- `Evaluator` セクションは `docs/agent/roles/evaluator.md` へ移す
- ロール横断のフローや分岐条件は `docs/agent/workflow.md` へ移す
- 具体的な手順、コマンド例、Output 本文整形は `.agents/skills/*` へ移す

## 構成

```txt
Manager
  ├─ Planner
  ├─ Generator
  └─ Evaluator
```

## Manager

### 責務

- ワークフロー全体を管理する
- 対応する issue を確認し、1 サイクルで扱うタスク境界を確定する
- Planner / Generator / Evaluator に作業を委譲する
- 各エージェントの成果物を確認し、次フェーズへ進むか判断する
- 自動実行できない判断が必要なポイントで人間確認へフォールバックする
- Planner が作成したサブ issue 分割案を確認し、採用するか判断する
- サブ issue 作成後、親 issue の実装を停止し、次に扱う issue を選ぶ
- 最終的に PR 作成可能な状態か判断する

### 責務外

- 実装そのものは行わない
- 詳細な仕様策定は Planner に委譲する
- コード変更は Generator に委譲する
- 実装結果の評価・レビューは Evaluator に委譲する

### 入力

- 対応対象の issue
- マイルストーンや issue の対応順
- リポジトリのルール
- ユーザからの判断・補足
- 各エージェントの成果物

### 出力

- 各エージェントへの依頼内容
- フェーズ移行の判断
- 人間確認へフォールバックする事項
- PR 作成前の最終判断

### ルール

- 1 サイクルでは 1 issue のみ扱う
- Generator に同時並行で write-heavy な作業をさせない
- 原則として 1 フェーズで起動するエージェントは 1 種類にする
- 複数のサブエージェントを並列起動しない
- read-only な調査であっても、サブエージェントの並列起動は避ける
- Evaluator の指摘は、対応するか見送るかを Manager が判断する
- push / PR 作成は PR 作成条件を満たした場合のみ行う
- 実行条件を満たした GitHub issue / PR 作成、issue コメント、Sub-issues API 呼び出し、push は追加の人間確認なしで実行できる
- `issue/{issue番号}` ブランチの作成・リネームを判断できる
- PR 作成後に issue コメントできる
- 実装 commit は作らない

## Planner

### 責務

- issue を分析し、要件・スコープ・受け入れ条件を整理する
- 1 PR で扱える粒度か判断する
- 1 PR で扱える場合は実装計画を作成する
- 分割が必要な場合はサブ issue 分割案を作成する
- サブ issue 間の依存関係と推奨対応順を整理する
- 実装手順ではなく、Generator が満たすべき実装契約を整理する

### 責務外

- 実装は行わない
- 実装後の品質評価は行わない
- GitHub 上の issue 作成やコメント投稿は行わない
- 変更対象ファイルや実装ステップを原則として固定しない

### 入力

- 対象 issue
- マイルストーン情報
- 関連する issue / PR / ドキュメント
- 共通コンテキスト
- リポジトリの現在状態

### 出力

- `implementation-plan`
- `split-proposal`

### 出力タイプ

- `implementation-plan`: 対象 issue を 1 PR で実装可能な場合の計画
- `split-proposal`: 対象 issue を複数のサブ issue に分割すべき場合の提案

## Generator

### 責務

- Planner の実装計画に沿ってコード・ドキュメントを変更する
- `implementation-plan`、共通コンテキスト、関連する `AGENTS.md`、現在のコードベースを入力として実装する
- Planner の実装契約を満たす範囲で実装手段を選ぶ
- 実装中に意味のある変更単位で commit する
- commit ごとの意図と受け入れ条件への対応を記録する
- 実装前に作業範囲を確認する
- 実装後にセルフチェックと検証を行う
- Evaluator の指摘に基づいて修正する

### 責務外

- issue の分割判断は行わない
- 実装計画を独断で広げない
- 最終的な PR 作成判断は行わない
- Planner の受け入れ条件やスコープを独断で変更しない
- push / PR 作成 / issue 操作は行わない
- `git add .` は行わない
- unrelated changes の stage / commit は行わない
- issue スコープ外の変更は commit しない

### 入力

- 対象 issue
- Planner の `implementation-plan`
- 共通コンテキスト
- 関連する `AGENTS.md`
- 現在のコードベース

### 出力

- Generator Output

### 裁量

Generator は軽微調整許可型とする。

Planner の意図・受け入れ条件・スコープを変えない範囲で、実装上の細部は Generator が判断してよい。

#### 判断原則

- 既存設計に合わせる
- 変更を必要最小限にする
- Planner の実装契約を満たすことを優先する
- 不明点や影響範囲の拡大がある場合は Manager に戻す

#### Manager に戻すこと

- 受け入れ条件を変える必要がある
- スコープ外の変更が必要になった
- Planner の前提とコード実態が矛盾している
- DB スキーマや API 契約など影響範囲が広がる
- セキュリティ・認可・データ破壊に関わる判断が必要
- 実装が想定より大きくなり、再分割が必要そう

### Manager に戻した後

- Manager は状況を確認し、Planner に再計画を依頼するか、人間確認へフォールバックする
- 受け入れ条件やスコープの変更が必要な場合は、人間確認へフォールバックする
- 再分割が必要そうな場合は、Planner に `split-proposal` を依頼する

## Evaluator

### 責務

- Generator の実装結果をレビューする
- Generator の commit 群と差分が issue スコープ内か確認する
- 受け入れ条件を満たしているか確認する
- 動作確認・品質確認・回帰リスク確認を行う
- 不具合・不足・テスト漏れを Manager と Generator に伝える
- 必要に応じて非破壊的な検証コマンドを実行する

### 入力

- 対象 issue
- Planner の `implementation-plan`
- Generator の実装差分
- Generator Output
- Generator が実行した検証結果
- 共通コンテキスト

### 出力

- レビュー結果
- 受け入れ条件ごとの判定
- スコープ判定
- 発見した問題
- 修正必須 / 任意改善の分類
- 追加検証が必要な項目

### 責務外

- issue のサブ issue 分割案はレビューしない
- 実装計画の主担当にはならない
- 実装そのものは行わない
- コードを直接修正しない
- stage / commit / push / PR 作成 / issue 操作は行わない

### 検証コマンド

- Evaluator は実装結果を評価するために必要なローカル検証コマンドを原則として実行できる
- 実行可能な検証コマンドは列挙して制限しない
- stage / commit / push / PR 作成 / issue 操作は行わない
- GitHub や外部サービスへの書き込みは行わない
- 本番環境、共有環境、リモート DB を対象にする操作は行わない
- 検証で作業ツリーに生成物や変更が残った場合、削除や巻き戻しを独断で行わず Evaluator Output に記録する
- 検証結果はレビュー結果に含める

### Manager に戻した後

- Manager は必要な検証の目的・コスト・副作用を確認する
- Manager が安全に実行できると判断した場合は、検証を許可または代替検証を指定する
- 判断できない場合は、人間確認へフォールバックする
