# docs/agent AGENTS.md

## Scope

- このディレクトリは、AI エージェント運用仕様の正本を扱う。
- 実行時に必ず守るルールは、ルートの `AGENTS.md` を優先する。
- この配下のドキュメントは、issue を起点に複数のエージェントで開発作業を進めるための設計・運用・機械的制御の仕様として参照する。

## Reading Order

1. ルートの `AGENTS.md`
2. [workflow.md](./workflow.md)
3. 自分のロール定義
4. 必要に応じて関連仕様

## Documents

- `workflow.md`: フェーズ遷移、開始条件、完了条件、Output 仕様、git / GitHub 操作責務
- `roles/`:
  - `manager.md`: Manager の責務、入力、出力、判断範囲
  - `planner.md`: Planner の責務、入力、出力、計画作成範囲
  - `generator.md`: Generator の責務、入力、出力、実装裁量
  - `evaluator.md`: Evaluator の責務、入力、出力、検証範囲
- `rules/`: sandbox / approval / rules / hooks の運用仕様

```txt
docs/agent/
  ├── AGENTS.md
  ├── workflow.md
  ├── roles/
  │   ├── manager.md
  │   ├── planner.md
  │   ├── generator.md
  │   └── evaluator.md
  └── rules/
```

## Source of Truth

- このディレクトリの文書は、エージェント開発ワークフローの運用ルールの正本とする。
- 具体的なコマンド例、issue コメント本文の組み立て、反復的な手順は `.agents/skills/*/SKILL.md` に外部化する。
- skill とこのディレクトリの内容が矛盾する場合は、このディレクトリの正式ドキュメントを優先する。
